import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'My Company Inc.' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
