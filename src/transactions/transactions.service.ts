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

  async findAll(orgId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { organizationId: orgId },
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
      throw new NotFoundException('Transaction not found');
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
      throw new NotFoundException('Transaction not found');
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
      throw new BadRequestException(`Account ${accountId} not found or does not belong to organization`);
    }
  }

  private validateTransactionLogic(dto: CreateTransactionDto) {
    switch (dto.type) {
      case 'INCOME':
        if (!dto.toAccountId) {
          throw new BadRequestException('Income transactions require toAccountId');
        }
        break;
      case 'EXPENSE':
        if (!dto.fromAccountId) {
          throw new BadRequestException('Expense transactions require fromAccountId');
        }
        break;
      case 'TRANSFER':
        if (!dto.fromAccountId || !dto.toAccountId) {
          throw new BadRequestException('Transfer transactions require both fromAccountId and toAccountId');
        }
        if (dto.fromAccountId === dto.toAccountId) {
          throw new BadRequestException('Cannot transfer to the same account');
        }
        break;
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
