import type { FindPermissionKeysByRoleParams } from '@/modules/permissions/providers/interfaces';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable } from '@nestjs/common';

/**
 * Resolves the permission key strings assigned to a role.
 * Used at sign-in time to embed permissions in the JWT payload so that
 * guards can check them without a database round-trip on each request.
 */
@Injectable()
export class FindPermissionKeysByRoleProvider {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  async execute({ roleId }: FindPermissionKeysByRoleParams): Promise<string[]> {
    const results = await this.permissionRepo.rawQuery<{ key: string }>(
      'SELECT p.key FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = $1',
      [roleId],
    );
    return results.map((r) => r.key);
  }
}
