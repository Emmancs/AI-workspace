import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkspace(workspaceId: string, filters?: { search?: string; projectId?: string }) {
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

  async findById(documentId: string) {
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
    return this.prisma.document.create({
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
  }

  async update(documentId: string, dto: UpdateDocumentDto) {
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

    return updated;
  }

  async delete(documentId: string) {
    await this.prisma.document.delete({ where: { id: documentId } });
    return { message: 'Document deleted successfully' };
  }

  async archive(documentId: string) {
    return this.prisma.document.update({
      where: { id: documentId },
      data: { isArchived: true },
    });
  }

  async getVersions(documentId: string) {
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
    // Get the version to restore
    const version = await this.prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
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
    // Verify document exists
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    // Create or update share
    return this.prisma.documentShare.upsert({
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

  async getDocumentShares(documentId: string) {
    return this.prisma.documentShare.findMany({
      where: { documentId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        sharedBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateShare(documentId: string, userId: string, permissionLevel: 'READ' | 'WRITE' | 'ADMIN') {
    return this.prisma.documentShare.update({
      where: { documentId_userId: { documentId, userId } },
      data: { permissionLevel: permissionLevel as any },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async unshareDocument(documentId: string, userId: string) {
    await this.prisma.documentShare.delete({
      where: { documentId_userId: { documentId, userId } },
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
}
