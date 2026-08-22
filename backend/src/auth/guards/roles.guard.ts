import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (user.isSystemAdmin) {
      return true;
    }

    const workspaceId =
      request.params?.workspaceId ||
      request.params?.id ||
      request.headers?.['x-workspace-id'] ||
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID context is required for role verification');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const roleHierarchy: Record<WorkspaceRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      EDITOR: 2,
      VIEWER: 1,
    };

    const userRoleLevel = roleHierarchy[member.role];
    const isAuthorized = requiredRoles.some(
      (role) => userRoleLevel >= roleHierarchy[role],
    );

    if (!isAuthorized) {
      throw new ForbiddenException(`Requires role ${requiredRoles.join(' or ')} in this workspace`);
    }

    request.workspaceMember = member;
    return true;
  }
}
