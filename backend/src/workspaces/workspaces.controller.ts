import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceRole } from '@prisma/client';

@ApiTags('Workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all workspaces accessible by current user' })
  async getUserWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new workspace' })
  async createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(userId, dto);
  }

  @Get('invitations/:token')
  @ApiOperation({ summary: 'Verify workspace invitation token' })
  async getInvitation(@Param('token') token: string) {
    return this.workspacesService.getInvitationByToken(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept workspace invitation' })
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.acceptInvitation(token, userId);
  }

  @Post('invitations/:token/reject')
  @ApiOperation({ summary: 'Reject workspace invitation' })
  async rejectInvitation(@Param('token') token: string) {
    return this.workspacesService.rejectInvitation(token);
  }

  @Get(':workspaceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workspace details by ID' })
  async getWorkspaceById(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.getWorkspaceById(workspaceId, userId);
  }

  @Patch(':workspaceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update workspace profile & settings (ADMIN required)' })
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateWorkspace(workspaceId, dto);
  }

  @Delete(':workspaceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete workspace (OWNER required)' })
  async deleteWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.deleteWorkspace(workspaceId);
  }

  @Get(':workspaceId/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.VIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List members of a workspace' })
  async getMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.getMembers(workspaceId);
  }

  @Patch(':workspaceId/members/:memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role (ADMIN required)' })
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, memberId, dto.role);
  }

  @Delete(':workspaceId/members/:memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove member from workspace (ADMIN required)' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(workspaceId, memberId);
  }

  @Post(':workspaceId/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send workspace invitation via email (ADMIN required)' })
  async createInvitation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.workspacesService.createInvitation(workspaceId, userId, dto);
  }
}
