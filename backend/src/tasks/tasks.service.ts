import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findByProject(projectId: string, filters?: { status?: string; priority?: string }) {
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

  async findById(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        labels: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    return this.prisma.task.create({
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
  }

  async update(taskId: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
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
  }

  async delete(taskId: string) {
    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted successfully' };
  }

  async findByWorkspace(workspaceId: string, filters?: { status?: string; priority?: string }) {
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
