import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';

interface CollaboratorPresence {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  status: 'editing' | 'viewing';
  color: string;
}

@WebSocketGateway({
  namespace: '/collab',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Injectable()
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CollaborationGateway.name);

  @WebSocketServer()
  server: Server;

  private readonly documentPresence = new Map<string, Map<string, CollaboratorPresence>>();
  private readonly documentStates = new Map<string, Y.Doc>();
  private readonly userColors = ['#8b5cf6', '#22c55e', '#f59e0b', '#38bdf8', '#f472b6', '#fb7185'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticateClient(client);
      client.data.user = user;
      client.data.authenticated = true;
    } catch (error) {
      this.logger.warn(`Rejected connection from ${client.id}: ${error instanceof Error ? error.message : 'Unknown auth error'}`);
      client.emit('connection:error', {
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const documentId = client.data.documentId as string | undefined;
    if (!documentId) return;

    const room = this.getRoomName(documentId);
    const presenceMap = this.documentPresence.get(documentId);
    if (!presenceMap) return;

    presenceMap.delete(client.id);
    if (presenceMap.size === 0) {
      this.documentPresence.delete(documentId);
    }

    this.server.to(room).emit('presence:update', {
      documentId,
      collaborators: this.getCollaborators(documentId),
    });
  }

  @SubscribeMessage('joinDocument')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId?: string; workspaceId?: string },
  ) {
    const user = await this.authenticateClient(client);
    const documentId = payload?.documentId;
    const workspaceId = payload?.workspaceId;

    if (!documentId || !workspaceId) {
      throw new ForbiddenException('Document and workspace identifiers are required');
    }

    const access = await this.documentsService.validateDocumentAccess(documentId, workspaceId, user.id);
    const room = this.getRoomName(documentId);
    client.join(room);

    client.data.user = user;
    client.data.documentId = documentId;
    client.data.workspaceId = workspaceId;
    client.data.accessLevel = access.accessLevel;

    const presence: CollaboratorPresence = {
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl ?? null,
      status: 'editing',
      color: this.getUserColor(user.id),
    };

    const presenceMap = this.documentPresence.get(documentId) ?? new Map<string, CollaboratorPresence>();
    presenceMap.set(client.id, presence);
    this.documentPresence.set(documentId, presenceMap);

    const state = this.getOrCreateDocumentState(documentId);
    const stateUpdate = Array.from(Y.encodeStateAsUpdate(state));

    client.emit('document:initial', {
      documentId,
      workspaceId,
      content: access.document.content ?? {},
      update: stateUpdate,
      collaborators: this.getCollaborators(documentId),
    });

    this.server.to(room).emit('presence:update', {
      documentId,
      collaborators: this.getCollaborators(documentId),
    });

    this.logger.log(`User ${user.email} joined collaboration room for document ${documentId}`);
  }

  @SubscribeMessage('presence:state')
  async handlePresenceState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId?: string; status?: 'editing' | 'viewing' },
  ) {
    const user = client.data.user as { id: string; name: string; avatarUrl?: string | null } | undefined;
    const documentId = payload?.documentId ?? client.data.documentId;

    if (!user || !documentId) {
      return;
    }

    const presenceMap = this.documentPresence.get(documentId);
    if (!presenceMap) return;

    const currentPresence = presenceMap.get(client.id);
    if (!currentPresence) return;

    const nextPresence = {
      ...currentPresence,
      status: payload?.status ?? currentPresence.status,
    };

    presenceMap.set(client.id, nextPresence);
    this.server.to(this.getRoomName(documentId)).emit('presence:update', {
      documentId,
      collaborators: this.getCollaborators(documentId),
    });
  }

  @SubscribeMessage('document:update')
  async handleDocumentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId?: string; workspaceId?: string; update?: number[] },
  ) {
    const user = client.data.user as { id: string } | undefined;
    const accessLevel = client.data.accessLevel as 'READ' | 'WRITE' | 'ADMIN' | undefined;
    const documentId = payload?.documentId ?? client.data.documentId;
    const workspaceId = payload?.workspaceId ?? client.data.workspaceId;

    if (!user || !documentId || !workspaceId || !payload?.update) {
      throw new ForbiddenException('Invalid collaboration payload');
    }

    if (!accessLevel || (accessLevel !== 'WRITE' && accessLevel !== 'ADMIN')) {
      throw new ForbiddenException('Document collaboration requires WRITE access');
    }

    const access = await this.documentsService.validateDocumentAccess(documentId, workspaceId, user.id);
    if (access.accessLevel === 'READ') {
      throw new ForbiddenException('You cannot edit this document');
    }

    const room = this.getRoomName(documentId);
    const doc = this.getOrCreateDocumentState(documentId);
    const update = Uint8Array.from(payload.update);
    Y.applyUpdate(doc, update, client.id);

    this.server.to(room).emit('document:remote-update', {
      documentId,
      workspaceId,
      update: Array.from(update),
      senderId: user.id,
    });
  }

  private async authenticateClient(client: Socket) {
    const authToken = client.handshake.auth?.token ?? client.handshake.headers?.authorization;
    const bearer = typeof authToken === 'string' ? authToken : Array.isArray(authToken) ? authToken[0] : undefined;
    const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : bearer;

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isSuspended: true,
        },
      });

      if (!user || user.isSuspended) {
        throw new UnauthorizedException('User is not authorized to collaborate');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  private getRoomName(documentId: string) {
    return `document:${documentId}`;
  }

  private getOrCreateDocumentState(documentId: string) {
    const existing = this.documentStates.get(documentId);
    if (existing) return existing;

    const created = new Y.Doc();
    this.documentStates.set(documentId, created);
    return created;
  }

  private getCollaborators(documentId: string) {
    return Array.from(this.documentPresence.get(documentId)?.values() ?? []).map((presence) => ({
      id: presence.userId,
      name: presence.name,
      avatarUrl: presence.avatarUrl,
      status: presence.status,
      color: presence.color,
    }));
  }

  private getUserColor(userId: string) {
    const hash = Array.from(userId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return this.userColors[hash % this.userColors.length];
  }
}
