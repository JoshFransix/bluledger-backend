import { Injectable, CanActivate, ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from '../../organizations/organizations.service';

@Injectable()
export class OrgAccessGuard implements CanActivate {
  constructor(private organizationsService: OrganizationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.headers['x-org-id'];

    if (!orgId) {
      throw new BadRequestException('x-org-id header is required');
    }

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Verify user has access to this organization
    const hasAccess = await this.organizationsService.verifyUserAccess(orgId, user.id);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Attach orgId to request for easy access in controllers
    request.organizationId = orgId;

    return true;
  }
}
