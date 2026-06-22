import type { Permission } from '@/modules/permissions/entities/permission.entity';

export interface FindOrCreatePermissionResult {
  permission: Permission;
  created: boolean;
}
