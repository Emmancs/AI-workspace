import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, workspaceId: string, query: string) {
    const term = query.trim();
    if (term.length < 2) return { query: term, results: [] };

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('You do not have access to this workspace');

    const [documents, projects, tasks, members] = await Promise.all([
      this.prisma.document.findMany({
        where: {
          workspaceId,
          isArchived: false,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { plainText: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.task.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, updatedAt: true, projectId: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
        select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        take: 10,
      }),
    ]);

    return {
      query: term,
      results: [
        ...documents.map((item) => ({ type: 'document', id: item.id, title: item.title, updatedAt: item.updatedAt, href: `/documents/${item.id}` })),
        ...projects.map((item) => ({ type: 'project', id: item.id, title: item.name, updatedAt: item.updatedAt, href: `/workspaces/${workspaceId}/projects?projectId=${item.id}` })),
        ...tasks.map((item) => ({ type: 'task', id: item.id, title: item.title, updatedAt: item.updatedAt, href: `/workspaces/${workspaceId}/tasks?taskId=${item.id}` })),
        ...members.map(({ user }) => ({ type: 'member', id: user.id, title: user.name, subtitle: user.email, href: `/workspaces/${workspaceId}/members` })),
      ],
    };
  }
}
