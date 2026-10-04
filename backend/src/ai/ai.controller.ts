import { BadRequestException, Controller, Post, Body, UseGuards, Get, Param, Headers } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SummarizeDocumentDto, GenerateContentDto, ChatDto } from './dto/ai.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize a document or text' })
  async summarize(
    @Body() dto: SummarizeDocumentDto,
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }
    if (dto.documentId) {
      return this.aiService.summarizeDocument(dto.documentId, userId, workspaceId);
    } else if (dto.text) {
      return this.aiService.summarizeText(dto.text, userId, workspaceId);
    }
    throw new BadRequestException('documentId or text is required');
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate content from a prompt' })
  async generate(
    @Body() dto: GenerateContentDto,
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }
    return this.aiService.generateContent(dto.prompt, userId, workspaceId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI' })
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }
    return this.aiService.chat(dto.message, userId, workspaceId, dto.conversationId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user AI conversations' })
  async getConversations(
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }
    return this.aiService.getConversations(userId, workspaceId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details' })
  async getConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('x-workspace-id header is required');
    }
    return this.aiService.getConversation(conversationId, userId, workspaceId);
  }
}
