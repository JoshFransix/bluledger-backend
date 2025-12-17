import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'], required: false })
  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  @IsOptional()
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fromAccountId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  toAccountId?: string;
}
