import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { CollaborationGateway } from './collaboration.gateway';

describe('DocumentsService.validateDocumentAccess', () => {
  const prisma: any = {
    document: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    documentShare: {
      findUnique: jest.fn(),
    },
  };

  const service = new DocumentsService(prisma as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('allows document owners to collaborate in their workspace', async () => {
    prisma.document.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-1',
      workspaceId: 'ws-1',
      createdById: 'user-1',
      content: { type: 'doc', content: [] },
    });
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({ id: 'member-1' });
    prisma.documentShare.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.validateDocumentAccess('doc-1', 'ws-1', 'user-1')).resolves.toMatchObject({
      accessLevel: 'ADMIN',
      document: { id: 'doc-1', workspaceId: 'ws-1' },
    });
  });

  it('rejects a document that belongs to a different workspace', async () => {
    prisma.document.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-2',
      workspaceId: 'ws-2',
      createdById: 'user-1',
      content: { type: 'doc', content: [] },
    });

    await expect(service.validateDocumentAccess('doc-2', 'ws-1', 'user-2')).rejects.toThrow('Document does not belong to the requested workspace');
  });

  it('requires membership in the workspace before granting document access', async () => {
    prisma.document.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-3',
      workspaceId: 'ws-3',
      createdById: 'user-owner',
      content: { type: 'doc', content: [] },
    });
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.validateDocumentAccess('doc-3', 'ws-3', 'user-2')).rejects.toThrow('User is not a member of this workspace');
  });
});

describe('CollaborationGateway.authenticateClient', () => {
  const prisma: any = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const jwtService = { verify: jest.fn() } as unknown as JwtService;
  const gateway = new CollaborationGateway(prisma as PrismaService, {} as DocumentsService, jwtService);

  beforeEach(() => jest.clearAllMocks());

  it('rejects requests with an invalid token', async () => {
    jwtService.verify = jest.fn().mockImplementation(() => {
      throw new Error('bad token');
    });

    await expect((gateway as any).authenticateClient({
      handshake: { auth: { token: 'bad-token' }, headers: {} },
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
