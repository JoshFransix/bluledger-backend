import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationDto } from './dto/organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created', type: OrganizationDto })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for current user' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved', type: [OrganizationDto] })
  findAll(@CurrentUser('id') userId: string) {
    return this.organizationsService.findAllForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved', type: OrganizationDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.organizationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization (admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated', type: OrganizationDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, userId, dto);
  }
}
