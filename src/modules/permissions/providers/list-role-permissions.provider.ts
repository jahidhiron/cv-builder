import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class ListRolePermissionsProvider {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  execute(roleId: number): Promise<Permission[]> {
    return this.permissionRepo.rawQuery<Permission>(
      'SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = $1',
      [roleId],
    );
  }
}
