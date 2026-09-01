import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmbeddingsService } from './embeddings.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SourceType } from '@prisma/client';

class CreateEmbeddingDto {
  content: string;
  sourceType: SourceType;
  sourceId: string;
  workspaceId: string;
  metadata?: Record<string, any>;
}

class SearchEmbeddingsDto {
  query: string;
  limit?: number;
  sourceType?: SourceType;
}

@Controller('api/embeddings')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post('create')
  async createEmbedding(
    @CurrentUser() user: any,
    @Body() dto: CreateEmbeddingDto,
  ) {
    return await this.embeddingsService.createEmbedding({
      content: dto.content,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      workspaceId: dto.workspaceId,
      metadata: {
        ...dto.metadata,
        createdBy: user.id,
      },
    });
  }

  @Post('update')
  async updateEmbedding(
    @CurrentUser() user: any,
    @Body() dto: CreateEmbeddingDto,
  ) {
    return await this.embeddingsService.updateEmbeddings({
      content: dto.content,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      workspaceId: dto.workspaceId,
      metadata: {
        ...dto.metadata,
        updatedBy: user.id,
      },
    });
  }

  @Post('search')
  async search(
    @CurrentUser() user: any,
    @Body() dto: SearchEmbeddingsDto,
    @Query('workspaceId') workspaceId: string,
  ) {
    return await this.embeddingsService.search(
      dto.query,
      workspaceId,
      dto.limit || 10,
      dto.sourceType,
    );
  }

  @Get(':sourceType/:sourceId')
  async getBySource(
    @Param('sourceType') sourceType: SourceType,
    @Param('sourceId') sourceId: string,
  ) {
    return await this.embeddingsService.getEmbeddingsBySource(sourceType, sourceId);
  }

  @Delete(':sourceType/:sourceId')
  async deleteEmbeddings(
    @Param('sourceType') sourceType: SourceType,
    @Param('sourceId') sourceId: string,
  ) {
    const count = await this.embeddingsService.deleteEmbeddings(sourceType, sourceId);
    return { deleted: count };
  }

  @Get('stats/:workspaceId')
  async getWorkspaceStats(
    @Param('workspaceId') workspaceId: string,
  ) {
    return await this.embeddingsService.getWorkspaceStats(workspaceId);
  }

  @Delete('clear/:workspaceId')
  async clearWorkspaceEmbeddings(
    @Param('workspaceId') workspaceId: string,
  ) {
    const count = await this.embeddingsService.clearWorkspaceEmbeddings(workspaceId);
    return { cleared: count };
  }
}
