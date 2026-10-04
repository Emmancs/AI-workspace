import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SourceType } from '@prisma/client';

export class CreateDocumentDto {
  workspaceId: string;
  projectId?: string;
  title: string;
  content?: any;
  plainText?: string;
}

export class UpdateDocumentDto {
  title?: string;
  content?: any;
  plainText?: string;
  isArchived?: boolean;
}

export class ShareDocumentDto {
  userId: string;
  permissionLevel: 'READ' | 'WRITE' | 'ADMIN';
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications?: NotificationsService,
    private readonly embeddings?: EmbeddingsService,
  ) {}

  async findByWorkspace(workspaceId: string, userId: string, filters?: { search?: string; projectId?: string }) {
    await this.assertWorkspaceMember(workspaceId, userId);
    const where: any = { workspaceId, isArchived: false };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { plainText: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.document.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true, versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(documentId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'READ');
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            replies: {
              include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
            },
          },
        },
        versions: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async create(dto: CreateDocumentDto, userId: string) {
    await this.assertWorkspaceMember(dto.workspaceId, userId);
    const document = await this.prisma.document.create({
      data: {
        workspaceId: dto.workspaceId,
        projectId: dto.projectId,
        title: dto.title,
        content: dto.content || {},
        plainText: dto.plainText,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: dto.workspaceId,
        actorId: userId,
        action: 'created',
        entityType: 'document',
        entityId: document.id,
        metadata: { title: document.title },
      },
    });
    this.queueEmbedding(document.id, document.workspaceId, document.title, document.plainText);
    return document;
  }

  async update(documentId: string, dto: UpdateDocumentDto, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'WRITE');
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        title: dto.title,
        content: dto.content,
        plainText: dto.plainText,
        isArchived: dto.isArchived,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Create a version entry when document is updated
    if (dto.content || dto.title) {
      await this.prisma.documentVersion.create({
        data: {
          documentId,
          title: dto.title || updated.title,
          content: dto.content || updated.content,
          version: await this.prisma.documentVersion.count({ where: { documentId } }) + 1,
          createdById: (await this.prisma.document.findUnique({ where: { id: documentId }, select: { createdById: true } }))?.createdById || '',
        },
      });
    }

    await this.prisma.activityLog.create({
      data: {
        workspaceId: updated.workspaceId,
        actorId: userId,
        action: 'updated',
        entityType: 'document',
        entityId: documentId,
        metadata: { title: updated.title },
      },
    });
    this.queueEmbedding(updated.id, updated.workspaceId, updated.title, updated.plainText);

    return updated;
  }

  private queueEmbedding(documentId: string, workspaceId: string, title: string, plainText?: string | null) {
    if (!this.embeddings) return;
    if (!plainText?.trim()) {
      void this.embeddings.deleteEmbeddings(SourceType.DOCUMENT, documentId).catch((error) => {
        console.error(`Embedding deletion failed for document ${documentId}`, error);
      });
      return;
    }
    void this.embeddings.updateEmbeddings({
      sourceType: SourceType.DOCUMENT,
      sourceId: documentId,
      workspaceId,
      content: `${title}\n\n${plainText}`,
      metadata: { title },
    }).catch((error) => {
      // Embeddings are supplementary; a provider outage must not block editing.
      console.error(`Embedding update failed for document ${documentId}`, error);
    });
  }

  async persistCollaborationContent(
    documentId: string,
    content: any,
    plainText: string | undefined,
    userId: string,
    collaborationState?: string,
  ) {
    await this.assertDocumentAccess(documentId, userId, 'WRITE');
    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: { content, plainText, ...(collaborationState ? { collaborationState } : {}) },
    });
    this.queueEmbedding(updated.id, updated.workspaceId, updated.title, updated.plainText);
    return updated;
  }

  async delete(documentId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'ADMIN');
    await this.prisma.document.delete({ where: { id: documentId } });
    return { message: 'Document deleted successfully' };
  }

  async archive(documentId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'ADMIN');
    return this.prisma.document.update({
      where: { id: documentId },
      data: { isArchived: true },
    });
  }

  async getVersions(documentId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'READ');
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    if (!versions || versions.length === 0) {
      throw new NotFoundException('No versions found for this document');
    }

    return versions;
  }

  async restoreVersion(documentId: string, versionId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'WRITE');
    // Get the version to restore
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }
    if (version.documentId !== documentId) {
      throw new NotFoundException('Version not found');
    }

    // Update document with version content
    const restored = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.content,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Create a new version entry for the restore action
    await this.prisma.documentVersion.create({
      data: {
        title: restored.title,
        content: version.content,
        version: await this.prisma.documentVersion.count({ where: { documentId } }) + 1,
        createdById: userId,
        documentId,
      },
    });

    return restored;
  }

  async shareDocument(documentId: string, dto: ShareDocumentDto, sharedById: string) {
    await this.assertDocumentAccess(documentId, sharedById, 'ADMIN');
    // Verify document exists
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    // Create or update share
    const share = await this.prisma.documentShare.upsert({
      where: { documentId_userId: { documentId, userId: dto.userId } },
      update: { permissionLevel: dto.permissionLevel as any },
      create: {
        documentId,
        userId: dto.userId,
        permissionLevel: dto.permissionLevel as any,
        sharedById,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        sharedBy: { select: { id: true, name: true } },
      },
    });
    await this.notifications?.create(dto.userId, {
      type: 'DOCUMENT_UPDATED',
      title: 'A document was shared with you',
      content: `You now have ${dto.permissionLevel.toLowerCase()} access to "${doc.title}".`,
      link: `/documents/${documentId}`,
    }, { documentId, permissionLevel: dto.permissionLevel });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: doc.workspaceId,
        actorId: sharedById,
        action: 'shared',
        entityType: 'document',
        entityId: documentId,
        metadata: { userId: dto.userId, permissionLevel: dto.permissionLevel },
      },
    });
    return share;
  }

  async getSharedWithMe(userId: string, workspaceId: string) {
    return this.prisma.documentShare.findMany({
      where: { userId, document: { workspaceId } },
      include: {
        document: {
          select: { id: true, title: true, updatedAt: true, createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        sharedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentShares(documentId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'ADMIN');
    return this.prisma.documentShare.findMany({
      where: { documentId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        sharedBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateShare(documentId: string, targetUserId: string, permissionLevel: 'READ' | 'WRITE' | 'ADMIN', userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'ADMIN');
    return this.prisma.documentShare.update({
      where: { documentId_userId: { documentId, userId: targetUserId } },
      data: { permissionLevel: permissionLevel as any },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async unshareDocument(documentId: string, targetUserId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId, 'ADMIN');
    await this.prisma.documentShare.delete({
      where: { documentId_userId: { documentId, userId: targetUserId } },
    });
    return { message: 'Document unshared successfully' };
  }

  async checkPermission(documentId: string, userId: string): Promise<'READ' | 'WRITE' | 'ADMIN' | null> {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId }, select: { createdById: true } });
    if (!doc) return null;

    // Creator has ADMIN access
    if (doc.createdById === userId) return 'ADMIN';

    // Check shares
    const share = await this.prisma.documentShare.findUnique({
      where: { documentId_userId: { documentId, userId } },
      select: { permissionLevel: true },
    });

    return (share?.permissionLevel as any) || null;
  }

  async validateDocumentAccess(documentId: string, workspaceId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        workspaceId: true,
        createdById: true,
        content: true,
        collaborationState: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.workspaceId !== workspaceId) {
      throw new ForbiddenException('Document does not belong to the requested workspace');
    }

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: document.workspaceId,
          userId,
        },
      },
      select: { id: true },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const creatorAccess = document.createdById === userId;
    const directShare = await this.prisma.documentShare.findUnique({
      where: { documentId_userId: { documentId, userId } },
      select: { permissionLevel: true },
    });

    const accessLevel = creatorAccess ? 'ADMIN' : (directShare?.permissionLevel as 'READ' | 'WRITE' | 'ADMIN' | undefined) ?? null;

    if (!accessLevel) {
      throw new ForbiddenException('User does not have access to this document');
    }

    return {
      document,
      accessLevel,
    };
  }

  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
  }

  private async assertDocumentAccess(
    documentId: string,
    userId: string,
    required: 'READ' | 'WRITE' | 'ADMIN',
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true, createdById: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.assertWorkspaceMember(document.workspaceId, userId);

    const permission = document.createdById === userId
      ? 'ADMIN'
      : (await this.prisma.documentShare.findUnique({
          where: { documentId_userId: { documentId, userId } },
          select: { permissionLevel: true },
        }))?.permissionLevel;

    const levels = { READ: 1, WRITE: 2, ADMIN: 3 };
    if (!permission || levels[permission] < levels[required]) {
      throw new ForbiddenException('User does not have access to this document');
    }
  }
}
