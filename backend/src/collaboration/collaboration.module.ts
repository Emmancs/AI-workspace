import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationGateway } from './collaboration.gateway';

@Module({
  imports: [PrismaModule, DocumentsModule, AuthModule],
  providers: [CollaborationGateway],
})
export class CollaborationModule {}
