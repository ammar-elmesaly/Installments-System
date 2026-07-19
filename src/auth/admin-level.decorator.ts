import { SetMetadata } from '@nestjs/common';
import { AdminLevel } from '../admins/enums/adminLevel.enum';

export const ADMIN_LEVEL_KEY = 'minAdminLevel';
export const MinAdminLevel = (level: AdminLevel) => SetMetadata(ADMIN_LEVEL_KEY, level);