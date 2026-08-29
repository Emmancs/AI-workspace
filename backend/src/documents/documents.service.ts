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
}
