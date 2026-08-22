import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { WorkspaceRole, InvitationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
                documents: true,
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          logoUrl: dto.logoUrl,
        },
      });

      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      return {
        ...workspace,
        role: member.role,
      };
    });
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                jobTitle: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            documents: true,
            tasks: true,
            discussions: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const currentMember = workspace.members.find((m) => m.userId === userId);
    if (!currentMember) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    return {
      ...workspace,
      currentRole: currentMember.role,
    };
  }

  async updateWorkspace(workspaceId: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        settings: dto.settings,
      },
    });
  }

  async deleteWorkspace(workspaceId: string) {
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
    return { message: 'Workspace deleted successfully' };
  }

  async getMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });
  }

  async updateMemberRole(workspaceId: string, memberId: string, newRole: WorkspaceRole) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Workspace member record not found');
    }

    if (member.role === WorkspaceRole.OWNER && newRole !== WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Workspace must retain at least one OWNER');
      }
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async removeMember(workspaceId: string, memberId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Workspace member record not found');
    }

    if (member.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the sole OWNER of workspace');
      }
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed from workspace' };
  }

  async createInvitation(workspaceId: string, invitedById: string, dto: CreateInvitationDto) {
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: dto.email.toLowerCase() },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        invitedById,
        expiresAt,
      },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true, logoUrl: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING || invitation.expiresAt < new Date()) {
      throw new NotFoundException('Invitation token is invalid or expired');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.getInvitationByToken(token);

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      return member;
    });
  }

  async rejectInvitation(token: string) {
    const invitation = await this.getInvitationByToken(token);

    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.REJECTED },
    });

    return { message: 'Invitation rejected' };
  }
}
