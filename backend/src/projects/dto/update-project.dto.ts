import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus, TaskPriority } from '@prisma/client';

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectStatus, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ enum: TaskPriority, required: false })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
