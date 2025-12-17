import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

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
}
