import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountDto } from './dto/account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgAccessGuard } from '../common/guards/org-access.guard';
import { OrgId } from '../common/decorators/org-id.decorator';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard, OrgAccessGuard)
@ApiBearerAuth()
@ApiSecurity('x-org-id')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created', type: AccountDto })
  create(@OrgId() orgId: string, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts for organization' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved', type: [AccountDto] })
  @ApiQuery({ name: 'type', required: false, enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], description: 'Filter by account type' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filter by currency code' })
  findAll(
    @OrgId() orgId: string,
    @Query('type') type?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
    @Query('isActive') isActive?: string,
    @Query('currency') currency?: string,
  ) {
    return this.accountsService.findAll(orgId, {
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      currency,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account retrieved', type: AccountDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.accountsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiResponse({ status: 200, description: 'Account updated', type: AccountDto })
  @ApiResponse({ status: 404, description: 'Account not found' })
  update(@OrgId() orgId: string, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  remove(@OrgId() orgId: string, @Param('id') id: string) {
    return this.accountsService.remove(orgId, id);
  }
}
