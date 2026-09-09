import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService, CreateDocumentDto, UpdateDocumentDto, ShareDocumentDto } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('workspace/:workspaceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List documents in a workspace' })
  async getDocumentsByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.documentsService.findByWorkspace(workspaceId, userId!, { search, projectId });
  }

  @Get(':documentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document details with comments and history' })
  async getDocument(@Param('documentId') documentId: string, @CurrentUser('id') userId: string) {
    return this.documentsService.findById(documentId, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new document' })
  async createDocument(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.create(dto, userId);
  }

  @Patch(':documentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document content or metadata' })
  async updateDocument(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.update(documentId, dto, userId);
  }

  @Delete(':documentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete document permanently' })
  async deleteDocument(@Param('documentId') documentId: string, @CurrentUser('id') userId: string) {
    return this.documentsService.delete(documentId, userId);
  }

  @Patch(':documentId/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive document (soft delete)' })
  async archiveDocument(@Param('documentId') documentId: string, @CurrentUser('id') userId: string) {
    return this.documentsService.archive(documentId, userId);
  }

  @Get(':documentId/versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all versions of a document' })
  async getDocumentVersions(@Param('documentId') documentId: string, @CurrentUser('id') userId: string) {
    return this.documentsService.getVersions(documentId, userId);
  }

  @Post(':documentId/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore document to a previous version' })
  async restoreVersion(
    @Param('documentId') documentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.restoreVersion(documentId, versionId, userId);
  }

  @Post(':documentId/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share document with a user' })
  async shareDocument(
    @Param('documentId') documentId: string,
    @Body() dto: ShareDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.shareDocument(documentId, dto, userId);
  }

  @Get(':documentId/shares')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all shares for a document' })
  async getDocumentShares(
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.getDocumentShares(documentId, userId);
  }

  @Patch(':documentId/share/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document share permission' })
  async updateShare(
    @Param('documentId') documentId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: ShareDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.updateShare(documentId, targetUserId, dto.permissionLevel, userId);
  }

  @Delete(':documentId/share/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke document share from a user' })
  async unshareDocument(
    @Param('documentId') documentId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.unshareDocument(documentId, targetUserId, userId);
  }

  @Get('shared-with-me/:workspaceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents shared with current user' })
  async getSharedWithMe(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.getSharedWithMe(userId, workspaceId);
  }
}
