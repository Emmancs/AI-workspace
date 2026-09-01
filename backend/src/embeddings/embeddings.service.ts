import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SourceType, Embedding } from '@prisma/client';
import axios from 'axios';

interface EmbeddingRequest {
  content: string;
  sourceType: SourceType;
  sourceId: string;
  workspaceId: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  embedding: Embedding;
  similarity: number;
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl = 'https://api.openai.com/v1/embeddings';
  private readonly embeddingModel = 'text-embedding-3-small';
  private readonly embeddingDimension = 1536;
  private readonly chunkSize = 8000; // Characters per chunk
  private readonly chunkOverlap = 200; // Overlap between chunks

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.openaiApiKey = this.config.get<string>('OPENAI_API_KEY', '');
  }

  /**
   * Split text into chunks with overlap
   */
  private chunkText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + this.chunkSize, text.length);
      chunks.push(text.substring(startIndex, endIndex));
      startIndex = endIndex - this.chunkOverlap;
    }

    return chunks;
  }

  /**
   * Get embeddings from OpenAI API
   */
  private async getOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.openaiApiKey) {
      this.logger.error('OPENAI_API_KEY not configured');
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        this.openaiApiUrl,
        {
          input: texts,
          model: this.embeddingModel,
          encoding_format: 'float',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response from OpenAI API');
      }

      return response.data.data.map((item: any) => item.embedding);
    } catch (error: any) {
      this.logger.error(`OpenAI API error: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Create or update embeddings for content
   */
  async createEmbedding(req: EmbeddingRequest): Promise<Embedding[]> {
    const chunks = this.chunkText(req.content);
    const embeddings: Embedding[] = [];

    try {
      // Get embeddings from OpenAI
      const vectors = await this.getOpenAIEmbeddings(chunks);

      // Store embeddings in database using raw SQL for pgvector support
      for (let i = 0; i < chunks.length; i++) {
        const id = this.generateId();
        const metadata = {
          ...req.metadata,
          chunkIndex: i,
          totalChunks: chunks.length,
        };

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO "Embedding" (id, "workspaceId", "sourceType", "sourceId", content, vector, metadata, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, $5, $6::vector(1536), $7, now(), now())`,
          id,
          req.workspaceId,
          req.sourceType,
          req.sourceId,
          chunks[i],
          JSON.stringify(vectors[i]),
          JSON.stringify(metadata),
        );

        embeddings.push({
          id,
          workspaceId: req.workspaceId,
          sourceType: req.sourceType,
          sourceId: req.sourceId,
          content: chunks[i],
          metadata: metadata as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          vector: vectors[i] as any,
        } as any);
      }

      this.logger.log(
        `Created ${embeddings.length} embeddings for ${req.sourceType}:${req.sourceId}`,
      );

      return embeddings;
    } catch (error) {
      this.logger.error(
        `Failed to create embeddings for ${req.sourceType}:${req.sourceId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Generate UUID for embeddings
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Delete embeddings for a source
   */
  async deleteEmbeddings(
    sourceType: SourceType,
    sourceId: string,
  ): Promise<number> {
    try {
      const result = await this.prisma.embedding.deleteMany({
        where: {
          sourceType,
          sourceId,
        },
      });

      this.logger.log(
        `Deleted ${result.count} embeddings for ${sourceType}:${sourceId}`,
      );

      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to delete embeddings for ${sourceType}:${sourceId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Update embeddings for a source (delete old, create new)
   */
  async updateEmbeddings(req: EmbeddingRequest): Promise<Embedding[]> {
    await this.deleteEmbeddings(req.sourceType, req.sourceId);
    return this.createEmbedding(req);
  }

  /**
   * Vector similarity search with workspace filtering
   * Uses cosine similarity for semantic search
   */
  async search(
    query: string,
    workspaceId: string,
    limit: number = 10,
    sourceTypeFilter?: SourceType,
  ): Promise<SearchResult[]> {
    try {
      // Get embedding for query
      const queryVectors = await this.getOpenAIEmbeddings([query]);
      const queryVector = queryVectors[0];

      // Execute raw SQL query for vector similarity search
      // Note: pgvector's <=> operator is for cosine distance
      const results = await this.prisma.$queryRaw<
        Array<{
          id: string;
          content: string;
          sourceType: string;
          sourceId: string;
          workspaceId: string;
          metadata: any;
          vector: number[];
          createdAt: Date;
          updatedAt: Date;
          similarity: number;
        }>
      >`
        SELECT 
          id, 
          content, 
          "sourceType", 
          "sourceId", 
          "workspaceId", 
          metadata, 
          vector,
          "createdAt",
          "updatedAt",
          (1 - (vector <=> ${queryVector as any})) as similarity
        FROM "Embedding"
        WHERE "workspaceId" = ${workspaceId}
          ${sourceTypeFilter ? `AND "sourceType" = ${sourceTypeFilter}` : ''}
        ORDER BY vector <=> ${queryVector as any}
        LIMIT ${limit}
      `;

      return results.map((row) => ({
        embedding: {
          id: row.id,
          content: row.content,
          sourceType: row.sourceType as SourceType,
          sourceId: row.sourceId,
          workspaceId: row.workspaceId,
          metadata: row.metadata,
          vector: row.vector as any,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        similarity: row.similarity,
      }));
    } catch (error) {
      this.logger.error(`Search failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get embeddings by source
   */
  async getEmbeddingsBySource(
    sourceType: SourceType,
    sourceId: string,
  ): Promise<Embedding[]> {
    try {
      return await this.prisma.embedding.findMany({
        where: {
          sourceType,
          sourceId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get embeddings for ${sourceType}:${sourceId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Clear all embeddings for a workspace
   */
  async clearWorkspaceEmbeddings(workspaceId: string): Promise<number> {
    try {
      const result = await this.prisma.embedding.deleteMany({
        where: {
          workspaceId,
        },
      });

      this.logger.log(`Cleared ${result.count} embeddings for workspace ${workspaceId}`);

      return result.count;
    } catch (error) {
      this.logger.error(
        `Failed to clear embeddings for workspace ${workspaceId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Get embedding statistics for a workspace
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    totalEmbeddings: number;
    bySourceType: Record<SourceType, number>;
    lastUpdated: Date | null;
  }> {
    try {
      const total = await this.prisma.embedding.count({
        where: { workspaceId },
      });

      const bySourceType = await this.prisma.embedding.groupBy({
        by: ['sourceType'],
        where: { workspaceId },
        _count: true,
      });

      const latest = await this.prisma.embedding.findFirst({
        where: { workspaceId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });

      return {
        totalEmbeddings: total,
        bySourceType: bySourceType.reduce(
          (acc, item) => {
            acc[item.sourceType] = item._count;
            return acc;
          },
          {} as Record<SourceType, number>,
        ),
        lastUpdated: latest?.updatedAt || null,
      };
    } catch (error) {
      this.logger.error(`Failed to get workspace stats: ${error}`);
      throw error;
    }
  }
}
