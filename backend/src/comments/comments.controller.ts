import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

export class CreateCommentDto {
  documentId: string;
  content: string;
  mentions?: string[]; // Array of mentioned user IDs
}

export class UpdateCommentDto {
  content?: string;
  isResolved?: boolean;
}

export class CreateCommentReplyDto {
  commentId: string;
  content: string;
  mentions?: string[]; // Array of mentioned user IDs
}

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('document/:documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments for a document' })
  async getDocumentComments(@Param('documentId') documentId: string) {
    return this.prisma.comment.findMany({
      where: { documentId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        replies: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment on a document' })
  async createComment(
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: dto.documentId },
      select: { workspaceId: true, title: true },
    });
    if (!document) throw new Error('Document not found');

    const comment = await this.prisma.comment.create({
      data: {
        documentId: dto.documentId,
        userId,
        content: dto.content,
        mentions: dto.mentions || [],
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        replies: true,
      },
    });

    await this.prisma.$transaction([
      this.prisma.activityLog.create({
        data: {
          workspaceId: document.workspaceId,
          actorId: userId,
          action: 'created',
          entityType: 'comment',
          entityId: comment.id,
          metadata: { documentId: dto.documentId },
        },
      }),
      ...((dto.mentions || [])
        .filter((mentionedUserId) => mentionedUserId !== userId)
        .map((mentionedUserId) =>
          this.prisma.notification.create({
            data: {
              userId: mentionedUserId,
              type: 'MENTION',
              title: 'You were mentioned in a comment',
              content: `You were mentioned in "${document.title}".`,
              link: `/documents/${dto.documentId}`,
              metadata: { commentId: comment.id, documentId: dto.documentId },
            },
          }),
        )),
    ]);

    return comment;
  }

  @Patch(':commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update comment' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    // Verify ownership
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (comment?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: dto.content,
        isResolved: dto.isResolved,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        replies: true,
      },
    });
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify ownership
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (comment?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  @Post(':commentId/replies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a comment' })
  async replyToComment(
    @Param('commentId') commentId: string,
    @Body() dto: CreateCommentReplyDto,
    @CurrentUser('id') userId: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { document: { select: { workspaceId: true, title: true } } },
    });
    if (!comment) throw new Error('Comment not found');

    const reply = await this.prisma.commentReply.create({
      data: {
        commentId,
        userId,
        content: dto.content,
        mentions: dto.mentions || [],
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const recipients = new Set([comment.userId, ...(dto.mentions || [])]);
    recipients.delete(userId);
    await this.prisma.$transaction([
      this.prisma.activityLog.create({
        data: {
          workspaceId: comment.document.workspaceId,
          actorId: userId,
          action: 'replied',
          entityType: 'comment',
          entityId: commentId,
          metadata: { replyId: reply.id, documentId: comment.documentId },
        },
      }),
      ...Array.from(recipients).map((recipientId) =>
        this.prisma.notification.create({
          data: {
            userId: recipientId,
            type: 'DISCUSSION_REPLY',
            title: 'New comment reply',
            content: `There is a new reply in "${comment.document.title}".`,
            link: `/documents/${comment.documentId}`,
            metadata: { commentId, replyId: reply.id },
          },
        }),
      ),
    ]);

    return reply;
  }

  @Delete('reply/:replyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment reply' })
  async deleteCommentReply(
    @Param('replyId') replyId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Verify ownership
    const reply = await this.prisma.commentReply.findUnique({ where: { id: replyId } });
    if (reply?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.commentReply.delete({ where: { id: replyId } });
    return { message: 'Reply deleted successfully' };
  }
}
