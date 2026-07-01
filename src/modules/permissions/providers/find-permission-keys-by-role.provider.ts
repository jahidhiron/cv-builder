import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { FindPermissionKeysByRoleParams } from '@/modules/permissions/providers/interfaces';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable } from '@nestjs/common';

/**
 * Provider that resolves the permission key strings assigned to a given role.
 *
 * Executes a raw SQL join between `permissions` and `role_permissions` for efficiency.
 * Called at sign-in time to embed permission keys in the JWT payload so that
 * `PermissionsGuard` can authorise requests without a database round-trip per request.
 *
 * @module Permission
 */
@Injectable()
export class FindPermissionKeysByRoleProvider {
  /**
   * @param permissionRepo - Repository used to run the raw permission-key query.
   */
  constructor(
    private readonly permissionRepo: PermissionRepository,
  ) {}

  /**
   * Returns all permission keys assigned to the given role.
   *
   * @param roleId - The role whose permission keys should be resolved.
   * @returns An array of permission key strings (e.g. `["users:read", "roles:create"]`).
   */
  @SystemLog(ModuleName.Permission)
  async execute({ roleId }: FindPermissionKeysByRoleParams): Promise<string[]> {
    const results = await this.permissionRepo.rawQuery<{ key: string }>(
      'SELECT p.key FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = $1',
      [roleId],
    );
    return results.map((r) => r.key);
  }
}
