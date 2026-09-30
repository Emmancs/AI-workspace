import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelName = 'gemini-1.5-flash';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private documentsService: DocumentsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  private getModel() {
    return this.genAI.getGenerativeModel({ model: this.modelName });
  }

  async summarizeDocument(documentId: string, userId: string, workspaceId: string) {
    // We get the document using the existing service which performs RBAC checks
    const document = await this.documentsService.findOne(documentId, userId);
    
    if (!document) {
      throw new NotFoundException('Document not found or access denied');
    }

    const contentToSummarize = document.plainText || JSON.stringify(document.content);
    if (!contentToSummarize || contentToSummarize.trim() === '') {
      return { summary: 'The document is empty.' };
    }

    try {
      const model = this.getModel();
      const prompt = `Please provide a concise summary of the following document:\n\n${contentToSummarize}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Log usage
      await this.prisma.aIUsageLog.create({
        data: {
          userId,
          workspaceId,
          model: this.modelName,
          operation: 'summarizeDocument',
        },
      });

      return { summary: text };
    } catch (error) {
      this.logger.error('Error in summarizeDocument', error);
      throw new InternalServerErrorException('Failed to generate summary');
    }
  }

  async summarizeText(text: string, userId: string, workspaceId: string) {
    if (!text || text.trim() === '') {
      return { summary: '' };
    }

    try {
      const model = this.getModel();
      const prompt = `Please provide a concise summary of the following text:\n\n${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summaryText = response.text();

      // Log usage
      await this.prisma.aIUsageLog.create({
        data: {
          userId,
          workspaceId,
          model: this.modelName,
          operation: 'summarizeText',
        },
      });

      return { summary: summaryText };
    } catch (error) {
      this.logger.error('Error in summarizeText', error);
      throw new InternalServerErrorException('Failed to generate summary');
    }
  }

  async generateContent(prompt: string, userId: string, workspaceId: string) {
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Log usage
      await this.prisma.aIUsageLog.create({
        data: {
          userId,
          workspaceId,
          model: this.modelName,
          operation: 'generateContent',
        },
      });

      return { generated: text };
    } catch (error) {
      this.logger.error('Error in generateContent', error);
      throw new InternalServerErrorException('Failed to generate content');
    }
  }

  async chat(message: string, userId: string, workspaceId: string, conversationId?: string) {
    try {
      let conversation;
      
      if (conversationId) {
        conversation = await this.prisma.aIConversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        
        if (conversation && conversation.userId !== userId) {
          throw new NotFoundException('Conversation not found');
        }
      }

      if (!conversation) {
        conversation = await this.prisma.aIConversation.create({
          data: {
            workspaceId,
            userId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          },
        });
      }

      // Save user message
      await this.prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message,
        },
      });

      const model = this.getModel();
      const chatHistory = conversation.messages?.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }],
      })) || [];

      const chatSession = model.startChat({
        history: chatHistory,
      });

      const result = await chatSession.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      // Save assistant message
      const assistantMessage = await this.prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: text,
        },
      });

      // Log usage
      await this.prisma.aIUsageLog.create({
        data: {
          userId,
          workspaceId,
          model: this.modelName,
          operation: 'chat',
        },
      });

      return {
        id: assistantMessage.id,
        conversationId: conversation.id,
        role: 'assistant',
        text: text,
      };
    } catch (error) {
      this.logger.error('Error in chat', error);
      throw new InternalServerErrorException('Failed to process chat message');
    }
  }

  async getConversations(userId: string, workspaceId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId, workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
