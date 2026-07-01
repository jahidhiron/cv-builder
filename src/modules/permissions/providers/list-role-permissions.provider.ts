import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Provider that returns all permissions assigned to a given role.
 *
 * Uses a raw JOIN on `role_permissions` rather than a TypeORM relation load because
 * the {@link Permission} entity does not declare a many-to-many back-reference to `Role`,
 * keeping the entity graph unidirectional to avoid eager-load ambiguity in other queries.
 *
 * @module Permission
 */
@Injectable({ scope: Scope.REQUEST })
export class ListRolePermissionsProvider {
  /**
   * @param permissionRepo - Repository used to run the raw permission query.
   */
  constructor(
    private readonly permissionRepo: PermissionRepository,
  ) {}

  /**
   * Returns all {@link Permission} entities currently assigned to the given role.
   *
   * @param roleId - Primary key of the role whose permissions should be listed.
   * @returns Array of {@link Permission} entities assigned to the role.
   */
  @SystemLog(ModuleName.Permission)
  execute(roleId: number): Promise<Permission[]> {
    return this.permissionRepo.rawQuery<Permission>(
      'SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = $1',
      [roleId],
    );
  }
}
