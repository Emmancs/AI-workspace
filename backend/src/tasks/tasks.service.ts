import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('You do not have access to this workspace');
  }

  async findByProject(projectId: string, userId: string, filters?: { status?: string; priority?: string }) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { workspaceId: true } });
    if (!project) throw new NotFoundException('Project not found');
    await this.assertMember(project.workspaceId, userId);
    const where: any = { projectId };
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        labels: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        labels: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertMember(task.workspaceId, userId);
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    await this.assertMember(dto.workspaceId, userId);
    const task = await this.prisma.task.create({
      data: {
        workspaceId: dto.workspaceId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority || TaskPriority.MEDIUM,
        assigneeId: dto.assigneeId,
        creatorId: userId,
        dueDate: dto.dueDate,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: dto.workspaceId,
        actorId: userId,
        action: 'created',
        entityType: 'task',
        entityId: task.id,
        metadata: { title: task.title },
      },
    });
    return task;
  }

  async update(taskId: string, dto: UpdateTaskDto, userId: string) {
    const existing = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new NotFoundException('Task not found');
    await this.assertMember(existing.workspaceId, userId);
    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: existing.workspaceId,
        actorId: userId,
        action: 'updated',
        entityType: 'task',
        entityId: taskId,
        metadata: { title: updated.title, status: updated.status },
      },
    });
    return updated;
  }

  async delete(taskId: string, userId: string) {
    const existing = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new NotFoundException('Task not found');
    await this.assertMember(existing.workspaceId, userId);
    await this.prisma.task.delete({ where: { id: taskId } });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: existing.workspaceId,
        actorId: userId,
        action: 'deleted',
        entityType: 'task',
        entityId: taskId,
      },
    });
    return { message: 'Task deleted successfully' };
  }

  async findByWorkspace(workspaceId: string, userId: string, filters?: { status?: string; priority?: string }) {
    await this.assertMember(workspaceId, userId);
    const where: any = { workspaceId };
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    return this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        labels: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
