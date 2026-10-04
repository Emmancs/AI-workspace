import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  private async assertMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true, role: true },
    });
    if (!member) throw new ForbiddenException('You do not have access to this workspace');
    return member;
  }

  async findByWorkspace(workspaceId: string, userId: string, filters?: { status?: string; priority?: string; search?: string }) {
    await this.assertMember(workspaceId, userId);
    const where: any = { workspaceId };
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        _count: { select: { tasks: true, documents: true, members: true, discussions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        _count: { select: { tasks: true, documents: true, discussions: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    await this.assertMember(project.workspaceId, userId);
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    await this.assertMember(dto.workspaceId, userId);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId: dto.workspaceId,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          ownerId: userId,
        },
      });

      await tx.projectMember.create({
        data: { projectId: project.id, userId },
      });
      await tx.activityLog.create({
        data: {
          workspaceId: dto.workspaceId,
          actorId: userId,
          action: 'created',
          entityType: 'project',
          entityId: project.id,
          metadata: { name: project.name },
        },
      });

      return project;
    });
  }

  async update(projectId: string, dto: UpdateProjectDto, userId: string) {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundException('Project not found');
    await this.assertMember(existing.workspaceId, userId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
      },
    });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: existing.workspaceId,
        actorId: userId,
        action: 'updated',
        entityType: 'project',
        entityId: projectId,
        metadata: { name: updated.name },
      },
    });
    return updated;
  }

  async delete(projectId: string, userId: string) {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundException('Project not found');
    await this.assertMember(existing.workspaceId, userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    await this.prisma.activityLog.create({
      data: {
        workspaceId: existing.workspaceId,
        actorId: userId,
        action: 'deleted',
        entityType: 'project',
        entityId: projectId,
      },
    });
    return { message: 'Project deleted successfully' };
  }

  async addMember(projectId: string, memberUserId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const actor = await this.assertMember(project.workspaceId, userId);
    if (project.ownerId !== userId && actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only the project owner or workspace administrators can manage project members');
    }
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId: memberUserId } },
    });
    if (!workspaceMember) throw new NotFoundException('User is not a workspace member');
    const member = await this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: memberUserId } },
      update: {},
      create: { projectId, userId: memberUserId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
    if (memberUserId !== userId) {
      await this.notifications.create(memberUserId, {
        type: 'PROJECT_UPDATE',
        title: 'You were added to a project',
        content: project.name,
        link: `/workspaces/${project.workspaceId}/projects?projectId=${project.id}`,
      }, { projectId: project.id });
    }
    return member;
  }

  async removeMember(projectId: string, memberUserId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const actor = await this.assertMember(project.workspaceId, userId);
    if (project.ownerId !== userId && actor.role !== 'OWNER' && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only the project owner or workspace administrators can manage project members');
    }
    await this.prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId: memberUserId } } });
    return { message: 'Project member removed' };
  }
}
