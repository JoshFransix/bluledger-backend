import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateTransactionDto) {
    // Validate accounts belong to organization
    if (dto.fromAccountId) {
      await this.validateAccount(orgId, dto.fromAccountId);
    }
    if (dto.toAccountId) {
      await this.validateAccount(orgId, dto.toAccountId);
    }

    // Validate transaction logic
    this.validateTransactionLogic(dto);

    const transaction = await this.prisma.transaction.create({
      data: {
        organizationId: orgId,
        type: dto.type,
        amount: new Decimal(dto.amount),
        currency: dto.currency || 'USD',
        description: dto.description,
        date: dto.date ? new Date(dto.date) : new Date(),
        category: dto.category,
        tags: dto.tags || [],
        fromAccountId: dto.fromAccountId,
        toAccountId: dto.toAccountId,
      },
    });

    // Update account balances
    await this.updateAccountBalances(transaction);

    return this.formatTransaction(transaction);
  }

  async findAll(
    orgId: string,
    filters?: {
      accountId?: string;
      type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      startDate?: string;
      endDate?: string;
      category?: string;
    },
  ) {
    const where: any = { organizationId: orgId };

    // Filter by account (either from or to)
    if (filters?.accountId) {
      where.OR = [
        { fromAccountId: filters.accountId },
        { toAccountId: filters.accountId },
      ];
    }

    // Filter by type
    if (filters?.type) {
      where.type = filters.type;
    }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    // Filter by category
    if (filters?.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        fromAccount: {
          select: { id: true, name: true },
        },
        toAccount: {
          select: { id: true, name: true },
        },
      },
    });

    return transactions.map((transaction) => this.formatTransaction(transaction));
  }

  async findOne(orgId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId: orgId,
      },
      include: {
        fromAccount: {
          select: { id: true, name: true },
        },
        toAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID '${transactionId}' not found in your organization.`
      );
    }

    return this.formatTransaction(transaction);
  }

  async update(orgId: string, transactionId: string, dto: UpdateTransactionDto) {
    // Get existing transaction
    const existing = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId: orgId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Transaction with ID '${transactionId}' not found in your organization.`
      );
    }

    // Validate new accounts if provided
    if (dto.fromAccountId) {
      await this.validateAccount(orgId, dto.fromAccountId);
    }
    if (dto.toAccountId) {
      await this.validateAccount(orgId, dto.toAccountId);
    }

    // Revert old balance changes
    await this.revertAccountBalances(existing);

    // Update transaction
    const updateData: any = { ...dto };
    if (dto.amount !== undefined) {
      updateData.amount = new Decimal(dto.amount);
    }
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }

    const transaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });

    // Apply new balance changes
    await this.updateAccountBalances(transaction);

    return this.formatTransaction(transaction);
  }

  async remove(orgId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId: orgId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Revert balance changes
    await this.revertAccountBalances(transaction);

    await this.prisma.transaction.delete({
      where: { id: transactionId },
    });

    return { message: 'Transaction deleted successfully' };
  }

  private async validateAccount(orgId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        organizationId: orgId,
      },
    });

    if (!account) {
      throw new BadRequestException(
        `Account with ID '${accountId}' not found in your organization. Please ensure the account exists and belongs to your organization.`
      );
    }

    if (!account.isActive) {
      throw new BadRequestException(
        `Account '${account.name}' is inactive. Please activate the account before creating transactions.`
      );
    }

    return account;
  }

  private validateTransactionLogic(dto: CreateTransactionDto) {
    // Validate amount is positive
    if (dto.amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than zero');
    }

    switch (dto.type) {
      case 'INCOME':
        if (!dto.toAccountId) {
          throw new BadRequestException(
            'Income transactions require a destination account (toAccountId). Please select which account will receive this income.'
          );
        }
        if (dto.fromAccountId) {
          throw new BadRequestException(
            'Income transactions should not have a source account (fromAccountId). Use TRANSFER for account-to-account movements.'
          );
        }
        break;
      case 'EXPENSE':
        if (!dto.fromAccountId) {
          throw new BadRequestException(
            'Expense transactions require a source account (fromAccountId). Please select which account will be charged.'
          );
        }
        if (dto.toAccountId) {
          throw new BadRequestException(
            'Expense transactions should not have a destination account (toAccountId). Use TRANSFER for account-to-account movements.'
          );
        }
        break;
      case 'TRANSFER':
        if (!dto.fromAccountId || !dto.toAccountId) {
          throw new BadRequestException(
            'Transfer transactions require both source (fromAccountId) and destination (toAccountId) accounts.'
          );
        }
        if (dto.fromAccountId === dto.toAccountId) {
          throw new BadRequestException(
            'Cannot transfer funds to the same account. Source and destination must be different.'
          );
        }
        break;
      default:
        throw new BadRequestException(
          `Invalid transaction type '${dto.type}'. Must be one of: INCOME, EXPENSE, TRANSFER`
        );
    }
  }

  private async updateAccountBalances(transaction: any) {
    const amount = new Decimal(transaction.amount);

    switch (transaction.type) {
      case 'INCOME':
        if (transaction.toAccountId) {
          await this.prisma.account.update({
            where: { id: transaction.toAccountId },
            data: { balance: { increment: amount } },
          });
        }
        break;
      case 'EXPENSE':
        if (transaction.fromAccountId) {
          await this.prisma.account.update({
            where: { id: transaction.fromAccountId },
            data: { balance: { decrement: amount } },
          });
        }
        break;
      case 'TRANSFER':
        if (transaction.fromAccountId && transaction.toAccountId) {
          await this.prisma.$transaction([
            this.prisma.account.update({
              where: { id: transaction.fromAccountId },
              data: { balance: { decrement: amount } },
            }),
            this.prisma.account.update({
              where: { id: transaction.toAccountId },
              data: { balance: { increment: amount } },
            }),
          ]);
        }
        break;
    }
  }

  private async revertAccountBalances(transaction: any) {
    const amount = new Decimal(transaction.amount);

    switch (transaction.type) {
      case 'INCOME':
        if (transaction.toAccountId) {
          await this.prisma.account.update({
            where: { id: transaction.toAccountId },
            data: { balance: { decrement: amount } },
          });
        }
        break;
      case 'EXPENSE':
        if (transaction.fromAccountId) {
          await this.prisma.account.update({
            where: { id: transaction.fromAccountId },
            data: { balance: { increment: amount } },
          });
        }
        break;
      case 'TRANSFER':
        if (transaction.fromAccountId && transaction.toAccountId) {
          await this.prisma.$transaction([
            this.prisma.account.update({
              where: { id: transaction.fromAccountId },
              data: { balance: { increment: amount } },
            }),
            this.prisma.account.update({
              where: { id: transaction.toAccountId },
              data: { balance: { decrement: amount } },
            }),
          ]);
        }
        break;
    }
  }

  private formatTransaction(transaction: any) {
    return {
      ...transaction,
      amount: transaction.amount.toString(),
    };
  }
}
