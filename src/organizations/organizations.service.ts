import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    // Create organization and add creator as admin
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: {
            role: true,
          },
        },
      },
    });

    return {
      id: organization.id,
      name: organization.name,
      role: organization.members[0].role,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
      createdAt: m.organization.createdAt,
      updatedAt: m.organization.updatedAt,
    }));
  }

  async findOne(orgId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found or access denied');
    }

    return {
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
      createdAt: membership.organization.createdAt,
      updatedAt: membership.organization.updatedAt,
    };
  }

  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    // Check if user has admin access
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    if (membership.role !== 'admin') {
      throw new ForbiddenException('Only admins can update organization details');
    }

    const organization = await this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });

    return {
      id: organization.id,
      name: organization.name,
      role: membership.role,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  async verifyUserAccess(orgId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    return !!membership;
  }

  async getUserRole(orgId: string, userId: string): Promise<string | null> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    return membership?.role || null;
  }

  async getSummary(orgId: string, userId: string) {
    // Verify access
    const hasAccess = await this.verifyUserAccess(orgId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Get organization with aggregated data
    const [organization, accounts, transactions, members] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: orgId },
      }),
      this.prisma.account.findMany({
        where: { organizationId: orgId, isActive: true },
        select: {
          balance: true,
          currency: true,
          type: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: { organizationId: orgId },
        _count: true,
      }),
      this.prisma.organizationMember.count({
        where: { organizationId: orgId },
      }),
    ]);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Calculate total balances by currency
    const balancesByCurrency = accounts.reduce((acc, account) => {
      const currency = account.currency || 'USD';
      if (!acc[currency]) {
        acc[currency] = {
          total: 0,
          assets: 0,
          liabilities: 0,
        };
      }
      const balance = parseFloat(account.balance.toString());
      acc[currency].total += balance;
      
      if (account.type === 'ASSET') {
        acc[currency].assets += balance;
      } else if (account.type === 'LIABILITY') {
        acc[currency].liabilities += balance;
      }
      
      return acc;
    }, {} as Record<string, { total: number; assets: number; liabilities: number }>);

    // Calculate net worth (assets - liabilities)
    const netWorthByCurrency = Object.entries(balancesByCurrency).reduce((acc, [currency, data]) => {
      acc[currency] = data.assets - data.liabilities;
      return acc;
    }, {} as Record<string, number>);

    return {
      id: organization.id,
      name: organization.name,
      stats: {
        accountsCount: accounts.length,
        transactionsCount: transactions._count,
        membersCount: members,
      },
      balances: balancesByCurrency,
      netWorth: netWorthByCurrency,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  async getMembers(orgId: string, userId: string) {
    // Verify user has access to organization
    const hasAccess = await this.verifyUserAccess(orgId, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async inviteMember(orgId: string, dto: InviteMemberDto, requestingUserId: string) {
    // Verify requesting user is admin
    const requestingMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: requestingUserId,
        },
      },
    });

    if (!requestingMembership || requestingMembership.role !== 'admin') {
      throw new ForbiddenException('Only admins can invite members');
    }

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found. User must register first.');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Validate role
    const role = dto.role || 'member';
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Add user to organization
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      createdAt: member.createdAt,
    };
  }

  async updateMemberRole(orgId: string, memberId: string, newRole: string, requestingUserId: string) {
    // Verify requesting user is admin
    const requestingMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: requestingUserId,
        },
      },
    });

    if (!requestingMembership || requestingMembership.role !== 'admin') {
      throw new ForbiddenException('Only admins can change member roles');
    }

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Update member role
    const member = await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      updatedAt: member.updatedAt,
    };
  }

  async removeMember(orgId: string, memberId: string, requestingUserId: string) {
    // Verify requesting user is admin
    const requestingMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: requestingUserId,
        },
      },
    });

    if (!requestingMembership || requestingMembership.role !== 'admin') {
      throw new ForbiddenException('Only admins can remove members');
    }

    // Get member to check if they're trying to remove themselves
    const memberToRemove = await this.prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    if (memberToRemove.userId === requestingUserId) {
      throw new BadRequestException('You cannot remove yourself from the organization');
    }

    // Check if this is the last admin
    if (memberToRemove.role === 'admin') {
      const adminCount = await this.prisma.organizationMember.count({
        where: {
          organizationId: orgId,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin from the organization');
      }
    }

    await this.prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return {
      message: 'Member removed successfully',
      removedUserId: memberToRemove.userId,
    };
  }
}
