import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('workspace/:workspaceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all projects in a workspace' })
  async getProjectsByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findByWorkspace(workspaceId, { status, priority, search });
  }

  @Get(':projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get project details by ID' })
  async getProject(@Param('projectId') projectId: string) {
    return this.projectsService.findById(projectId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new project in workspace' })
  async createProject(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.create(dto, userId);
  }

  @Patch(':projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project details' })
  async updateProject(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(projectId, dto);
  }

  @Delete(':projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete project' })
  async deleteProject(@Param('projectId') projectId: string) {
    return this.projectsService.delete(projectId);
  }
}
