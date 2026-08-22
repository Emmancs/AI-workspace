import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'FlowAI Product Workspace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Collaborative product development workspace for engineering team', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}
