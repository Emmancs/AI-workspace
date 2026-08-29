import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus, TaskPriority } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'E-Commerce Platform Core' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Full-stack store with auth, payments, products, and order tracking.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectStatus, default: ProjectStatus.PLANNING, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ example: 'workspace-uuid-here' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
