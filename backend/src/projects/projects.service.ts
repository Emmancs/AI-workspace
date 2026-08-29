import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkspace(workspaceId: string, filters?: { status?: string; priority?: string; search?: string }) {
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
        _count: { select: { tasks: true, documents: true, members: true, discussions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(projectId: string) {
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
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
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

      return project;
    });
  }

  async update(projectId: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
      },
    });
  }

  async delete(projectId: string) {
    await this.prisma.project.delete({ where: { id: projectId } });
    return { message: 'Project deleted successfully' };
  }
}
