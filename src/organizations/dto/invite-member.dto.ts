import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'member', enum: ['admin', 'member', 'viewer'], required: false })
  @IsOptional()
  @IsEnum(['admin', 'member', 'viewer'], { message: 'Role must be admin, member, or viewer' })
  role?: string;
}
