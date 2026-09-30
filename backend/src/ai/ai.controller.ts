import { Controller, Post, Body, UseGuards, Get, Param, Headers } from '@nestjs/common';
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
    // Usually workspaceId comes from the context, let's allow fallback if needed.
    const effectiveWorkspaceId = workspaceId || 'default-workspace';
    if (dto.documentId) {
      return this.aiService.summarizeDocument(dto.documentId, userId, effectiveWorkspaceId);
    } else if (dto.text) {
      return this.aiService.summarizeText(dto.text, userId, effectiveWorkspaceId);
    }
    return { summary: '' };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate content from a prompt' })
  async generate(
    @Body() dto: GenerateContentDto,
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.aiService.generateContent(dto.prompt, userId, workspaceId || 'default-workspace');
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI' })
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.aiService.chat(dto.message, userId, workspaceId || 'default-workspace', dto.conversationId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user AI conversations' })
  async getConversations(
    @CurrentUser('id') userId: string,
    @Headers('x-workspace-id') workspaceId: string,
  ) {
    return this.aiService.getConversations(userId, workspaceId || 'default-workspace');
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details' })
  async getConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.getConversation(conversationId, userId);
  }
}
