import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Returns all permissions assigned to a given role via a JOIN on `role_permissions`.
 *
 * Uses a raw query rather than a TypeORM relation load because the `Permission`
 * entity does not declare a many-to-many back-reference to `Role` — keeping the
 * entity graph unidirectional avoids eager-load ambiguity in other queries.
 */
@Injectable({ scope: Scope.REQUEST })
export class ListRolePermissionsProvider {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  /**
   * @param roleId - Primary key of the role to fetch permissions for.
   * @returns All `Permission` entities currently assigned to the role.
   */
  execute(roleId: number): Promise<Permission[]> {
    return this.permissionRepo.rawQuery<Permission>(
      'SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = $1',
      [roleId],
    );
  }
}
