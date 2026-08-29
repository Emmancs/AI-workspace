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
}

export class UpdateCommentDto {
  content?: string;
  isResolved?: boolean;
}

export class CreateCommentReplyDto {
  commentId: string;
  content: string;
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
    return this.prisma.comment.create({
      data: {
        documentId: dto.documentId,
        userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        replies: true,
      },
    });
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
    return this.prisma.commentReply.create({
      data: {
        commentId,
        userId,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
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
