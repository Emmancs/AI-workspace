import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationGateway } from './collaboration.gateway';

@Module({
  imports: [PrismaModule, DocumentsModule],
  providers: [CollaborationGateway],
})
export class CollaborationModule {}
