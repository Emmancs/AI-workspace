import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SummarizeDocumentDto {
  @IsString()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  text?: string;
}

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}
