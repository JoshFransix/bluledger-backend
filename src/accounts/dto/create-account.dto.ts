import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'Cash Account' })
  @IsString()
  @IsNotEmpty({ message: 'Account name is required' })
  @MinLength(2, { message: 'Account name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Account name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] })
  @IsEnum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], {
    message: 'Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE'
  })
  @IsNotEmpty({ message: 'Account type is required' })
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

  @ApiProperty({ example: 'USD', required: false, default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'Primary cash account', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
