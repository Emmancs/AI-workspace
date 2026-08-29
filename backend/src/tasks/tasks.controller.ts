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
import { TasksService, CreateTaskDto, UpdateTaskDto } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tasks in a project' })
  async getTasksByProject(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.tasksService.findByProject(projectId, { status, priority });
  }

  @Get('workspace/:workspaceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tasks in a workspace' })
  async getTasksByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.tasksService.findByWorkspace(workspaceId, { status, priority });
  }

  @Get(':taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get task details' })
  async getTask(@Param('taskId') taskId: string) {
    return this.tasksService.findById(taskId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @Body() dto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.create(dto, userId);
  }

  @Patch(':taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update task details' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, dto);
  }

  @Delete(':taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete task' })
  async deleteTask(@Param('taskId') taskId: string) {
    return this.tasksService.delete(taskId);
  }
}
