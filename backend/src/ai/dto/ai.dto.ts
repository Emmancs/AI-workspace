import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SummarizeDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  documentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30000)
  text?: string;
}

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  prompt: string;
}

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}
