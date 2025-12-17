import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateAccountDto) {
    // Check for duplicate account name in organization
    const existing = await this.prisma.account.findFirst({
      where: {
        organizationId: orgId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `An account with the name '${dto.name}' already exists in your organization. Please choose a different name.`
      );
    }

    const account = await this.prisma.account.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency || 'USD',
        description: dto.description,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.formatAccount(account);
  }

  async findAll(
    orgId: string,
    filters?: {
      type?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
      isActive?: boolean;
      currency?: string;
    },
  ) {
    const where: any = { organizationId: orgId };

    // Apply filters if provided
    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => this.formatAccount(account));
  }

  async findOne(orgId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        organizationId: orgId,
      },
    });

    if (!account) {
      throw new NotFoundException(
        `Account with ID '${accountId}' not found in your organization.`
      );
    }

    return this.formatAccount(account);
  }

  async update(orgId: string, accountId: string, dto: UpdateAccountDto) {
    // Verify account belongs to organization
    await this.findOne(orgId, accountId);

    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: dto,
    });

    return this.formatAccount(account);
  }

  async remove(orgId: string, accountId: string) {
    // Verify account belongs to organization
    const account = await this.findOne(orgId, accountId);

    // Check if account has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: {
        OR: [
          { fromAccountId: accountId },
          { toAccountId: accountId },
        ],
      },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        `Cannot delete account '${account.name}' because it has ${transactionCount} associated transaction(s). Please delete the transactions first or deactivate the account instead.`
      );
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    return { message: `Account '${account.name}' deleted successfully` };
  }

  private formatAccount(account: any) {
    return {
      ...account,
      balance: account.balance.toString(),
    };
  }
}
