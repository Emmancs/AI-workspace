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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List documents in a workspace' })
  async getDocumentsByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.documentsService.findByWorkspace(workspaceId, { search, projectId });
  }

  @Get(':documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document details with comments and history' })
  async getDocument(@Param('documentId') documentId: string) {
    return this.documentsService.findById(documentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new document' })
  async createDocument(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.create(dto, userId);
  }

  @Patch(':documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document content or metadata' })
  async updateDocument(
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(documentId, dto);
  }

  @Delete(':documentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete document permanently' })
  async deleteDocument(@Param('documentId') documentId: string) {
    return this.documentsService.delete(documentId);
  }

  @Patch(':documentId/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive document (soft delete)' })
  async archiveDocument(@Param('documentId') documentId: string) {
    return this.documentsService.archive(documentId);
  }

  @Get(':documentId/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all versions of a document' })
  async getDocumentVersions(@Param('documentId') documentId: string) {
    return this.documentsService.getVersions(documentId);
  }

  @Post(':documentId/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all shares for a document' })
  async getDocumentShares(@Param('documentId') documentId: string) {
    return this.documentsService.getDocumentShares(documentId);
  }

  @Patch(':documentId/share/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document share permission' })
  async updateShare(
    @Param('documentId') documentId: string,
    @Param('userId') userId: string,
    @Body() dto: ShareDocumentDto,
  ) {
    return this.documentsService.updateShare(documentId, userId, dto.permissionLevel);
  }

  @Delete(':documentId/share/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke document share from a user' })
  async unshareDocument(
    @Param('documentId') documentId: string,
    @Param('userId') userId: string,
  ) {
    return this.documentsService.unshareDocument(documentId, userId);
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
