import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('You do not have access to this workspace');
  }

  async workspaceOverview(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const [projects, tasks, documents, members, aiRequests, unreadNotifications, activity] =
      await Promise.all([
        this.prisma.project.count({ where: { workspaceId } }),
        this.prisma.task.count({ where: { workspaceId } }),
        this.prisma.document.count({ where: { workspaceId, isArchived: false } }),
        this.prisma.workspaceMember.count({ where: { workspaceId } }),
        this.prisma.aIUsageLog.count({ where: { workspaceId } }),
        this.prisma.notification.count({ where: { userId, isRead: false } }),
        this.prisma.activityLog.findMany({
          where: { workspaceId },
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
        }),
      ]);

    const [tasksByStatus, aiByOperation, documentsByDay] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], where: { workspaceId }, _count: { _all: true } }),
      this.prisma.aIUsageLog.groupBy({
        by: ['operation'],
        where: { workspaceId },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS count
        FROM "Document"
        WHERE "workspaceId" = ${workspaceId}
        GROUP BY DATE("createdAt")
        ORDER BY day DESC
        LIMIT 30
      `,
    ]);

    return {
      counts: { projects, tasks, documents, members, aiRequests, unreadNotifications },
      tasksByStatus: tasksByStatus.map((item) => ({ status: item.status, count: item._count._all })),
      aiByOperation: aiByOperation.map((item) => ({ operation: item.operation, count: item._count._all })),
      documentsByDay: documentsByDay.map((item) => ({ day: item.day, count: Number(item.count) })),
      activity,
    };
  }
}
