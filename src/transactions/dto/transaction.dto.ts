import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  category: string | null;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  fromAccountId: string | null;

  @ApiProperty()
  toAccountId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
