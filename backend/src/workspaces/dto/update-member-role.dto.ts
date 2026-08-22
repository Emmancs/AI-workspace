import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: WorkspaceRole })
  @IsEnum(WorkspaceRole, { message: 'Role must be OWNER, ADMIN, EDITOR, or VIEWER' })
  @IsNotEmpty()
  role: WorkspaceRole;
}
