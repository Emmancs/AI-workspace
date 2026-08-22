import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({ example: 'alex@flowai.io' })
  @IsEmail({}, { message: 'Invalid recipient email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: WorkspaceRole, default: WorkspaceRole.EDITOR })
  @IsEnum(WorkspaceRole, { message: 'Role must be OWNER, ADMIN, EDITOR, or VIEWER' })
  role: WorkspaceRole;
}
