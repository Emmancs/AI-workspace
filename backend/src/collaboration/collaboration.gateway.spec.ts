import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { CollaborationGateway } from './collaboration.gateway';
import * as Y from 'yjs';

describe('DocumentsService.validateDocumentAccess', () => {
  const prisma: any = {
    document: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    documentShare: {
      findUnique: jest.fn(),
    },
  };

  const service = new DocumentsService(prisma as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('allows document owners to collaborate in their workspace', async () => {
    prisma.document.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-1',
      workspaceId: 'ws-1',
      createdById: 'user-1',
      content: { type: 'doc', content: [] },
    });
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({ id: 'member-1' });
    prisma.documentShare.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.validateDocumentAccess('doc-1', 'ws-1', 'user-1')).resolves.toMatchObject({
      accessLevel: 'ADMIN',
      document: { id: 'doc-1', workspaceId: 'ws-1' },
    });
  });

  it('rejects a document that belongs to a different workspace', async () => {
    prisma.document.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-2',
      workspaceId: 'ws-2',
      createdById: 'user-1',
      content: { type: 'doc', content: [] },
    });

    await expect(service.validateDocumentAccess('doc-2', 'ws-1', 'user-2')).rejects.toThrow('Document does not belong to the requested workspace');
  });

  it('requires membership in the workspace before granting document access', async () => {
    prisma.document.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-3',
      workspaceId: 'ws-3',
      createdById: 'user-owner',
      content: { type: 'doc', content: [] },
    });
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.validateDocumentAccess('doc-3', 'ws-3', 'user-2')).rejects.toThrow('User is not a member of this workspace');
  });
});

describe('CollaborationGateway.authenticateClient', () => {
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const jwtService = { verify: jest.fn() } as unknown as JwtService;
  const gateway = new CollaborationGateway(prisma as PrismaService, {} as DocumentsService, jwtService);

  beforeEach(() => jest.clearAllMocks());

  it('rejects requests with an invalid token', async () => {
    jwtService.verify = jest.fn().mockImplementation(() => {
      throw new Error('bad token');
    });

    await expect((gateway as any).authenticateClient({
      handshake: { auth: { token: 'bad-token' }, headers: {} },
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('CollaborationGateway.handleDocumentUpdate', () => {
  const documentsService = {
    validateDocumentAccess: jest.fn(),
  } as unknown as DocumentsService;
  const gateway = new CollaborationGateway(
    {} as PrismaService,
    documentsService,
    {} as JwtService,
  );
  const emit = jest.fn();
  const room = { emit };

  beforeEach(() => {
    jest.clearAllMocks();
    (gateway as any).server = {
      to: jest.fn().mockReturnValue(room),
    };
  });

  it('rejects updates from READ collaborators', async () => {
    const client = {
      id: 'socket-read',
      data: {
        user: { id: 'user-read' },
        accessLevel: 'READ',
        documentId: 'doc-1',
        workspaceId: 'ws-1',
      },
      emit: jest.fn(),
    };

    await (gateway as any).handleDocumentUpdate(client, {
      documentId: 'doc-1',
      workspaceId: 'ws-1',
      update: [1, 2, 3],
    });

    expect(client.emit).toHaveBeenCalledWith('document:error', {
      message: 'Document collaboration requires WRITE access',
    });
    expect(emit).not.toHaveBeenCalled();
  });

  it('broadcasts accepted updates with the originating socket ID', async () => {
    documentsService.validateDocumentAccess = jest.fn().mockResolvedValue({
      accessLevel: 'WRITE',
    });
    documentsService.persistCollaborationContent = jest.fn().mockResolvedValue({});
    const client = {
      id: 'socket-write',
      data: {
        user: { id: 'user-write' },
        accessLevel: 'WRITE',
        documentId: 'doc-2',
        workspaceId: 'ws-2',
      },
      emit: jest.fn(),
    };
    const source = new Y.Doc();
    source.getMap('content').set('value', 'update');

    await (gateway as any).handleDocumentUpdate(client, {
      documentId: 'doc-2',
      workspaceId: 'ws-2',
      update: Array.from(Y.encodeStateAsUpdate(source)),
      content: { type: 'doc', content: [] },
      plainText: '',
    });

    expect(documentsService.persistCollaborationContent).toHaveBeenCalledWith(
      'doc-2',
      { type: 'doc', content: [] },
      '',
      'user-write',
    );
    expect(emit).toHaveBeenCalledWith('document:remote-update', expect.objectContaining({
      documentId: 'doc-2',
      senderSocketId: 'socket-write',
    }));
  });
});

describe('CollaborationGateway room lifecycle', () => {
  const documentsService = {
    validateDocumentAccess: jest.fn(),
  } as unknown as DocumentsService;
  const gateway = new CollaborationGateway(
    {} as PrismaService,
    documentsService,
    {} as JwtService,
  );
  const room = { emit: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (gateway as any).server = {
      to: jest.fn().mockReturnValue(room),
    };
    (gateway as any).authenticateClient = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User One',
      avatarUrl: null,
    });
  });

  it('disconnects clients that fail document access validation', async () => {
    documentsService.validateDocumentAccess = jest.fn().mockRejectedValue(new Error('User does not have access to this document'));
    const client = {
      id: 'socket-denied',
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await (gateway as any).handleJoinDocument(client, { documentId: 'doc-1', workspaceId: 'ws-1' });

    expect(client.emit).toHaveBeenCalledWith('document:error', {
      message: 'User does not have access to this document',
    });
    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('broadcasts presence changes and cleans up on disconnect', async () => {
    documentsService.validateDocumentAccess = jest.fn().mockResolvedValue({
      accessLevel: 'WRITE',
      document: { content: { type: 'doc', content: [] } },
    });
    const client = {
      id: 'socket-1',
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await (gateway as any).handleJoinDocument(client, { documentId: 'doc-1', workspaceId: 'ws-1' });
    await (gateway as any).handlePresenceState(client, { documentId: 'doc-1', status: 'viewing' });

    expect(room.emit).toHaveBeenCalledWith('presence:update', expect.objectContaining({
      documentId: 'doc-1',
      collaborators: [expect.objectContaining({ id: 'user-1', status: 'viewing' })],
    }));

    await (gateway as any).handleDisconnect(client);

    expect(room.emit).toHaveBeenLastCalledWith('presence:update', {
      documentId: 'doc-1',
      collaborators: [],
    });
    expect((gateway as any).documentPresence.has('doc-1')).toBe(false);
  });
});
