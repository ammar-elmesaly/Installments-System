import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_LEVEL_KEY } from './admin-level.decorator';
import { AdminLevel } from '../admins/enums/adminLevel.enum';

@Injectable()
export class AdminLevelGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevel = this.reflector.getAllAndOverride<AdminLevel>(ADMIN_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredLevel === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userAdminLevel: AdminLevel | undefined = request.user?.admin_level;

    if (userAdminLevel === undefined) {
      throw new ForbiddenException('No admin level found on the authenticated user.');
    }

    if (userAdminLevel < requiredLevel) {
      throw new ForbiddenException('Insufficient permissions for this action.');
    }

    return true;
  }
}