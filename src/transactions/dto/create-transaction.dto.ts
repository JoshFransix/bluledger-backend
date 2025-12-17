import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsString, IsOptional, IsDateString, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER'] })
  @IsEnum(['INCOME', 'EXPENSE', 'TRANSFER'])
  @IsNotEmpty()
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';

  @ApiProperty({ example: 1000.50, description: 'Transaction amount (must be positive)' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: 'Amount must be greater than zero' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'USD', required: false, default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'Monthly salary payment', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 'Salary', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: ['income', 'monthly'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 'account-id-123', required: false })
  @IsString()
  @IsOptional()
  fromAccountId?: string;

  @ApiProperty({ example: 'account-id-456', required: false })
  @IsString()
  @IsOptional()
  toAccountId?: string;
}
