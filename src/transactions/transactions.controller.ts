import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgAccessGuard } from '../common/guards/org-access.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, OrgAccessGuard)
@ApiBearerAuth()
@ApiSecurity('x-org-id')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created', type: TransactionDto })
  create(@OrgId() orgId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions for organization' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved', type: [TransactionDto] })
  @ApiQuery({ name: 'accountId', required: false, description: 'Filter by account (fromAccountId or toAccountId)' })
  @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE', 'TRANSFER'], description: 'Filter by transaction type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  findAll(
    @OrgId() orgId: string,
    @Query('accountId') accountId?: string,
    @Query('type') type?: 'INCOME' | 'EXPENSE' | 'TRANSFER',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
  ) {
    return this.transactionsService.findAll(orgId, {
      accountId,
      type,
      startDate,
      endDate,
      category,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved', type: TransactionDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.transactionsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated', type: TransactionDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.transactionsService.remove(orgId, id);
  }
}
