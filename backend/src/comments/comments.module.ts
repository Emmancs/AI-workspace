import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [CommentsController],
})
export class CommentsModule {}
