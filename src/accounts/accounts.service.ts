import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateAccountDto) {
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

  async findAll(orgId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { organizationId: orgId },
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
      throw new NotFoundException('Account not found');
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
    await this.findOne(orgId, accountId);

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted successfully' };
  }

  private formatAccount(account: any) {
    return {
      ...account,
      balance: account.balance.toString(),
    };
  }
}
