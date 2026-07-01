import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable } from '@nestjs/common';

/**
 * Provider that returns every row from the `permissions` table with no filters.
 *
 * Used exclusively by the admin-sync pipeline to identify orphaned permission
 * keys — those that exist in the DB but are no longer referenced by any
 * `@RequirePermissions` decorator in the running application.
 *
 * @module Permission
 */
@Injectable()
export class FindAllPermissionsProvider {
  /**
   * @param permissionRepo - Repository used to query all permission rows.
   */
  constructor(private readonly permissionRepo: PermissionRepository) {}

  /**
   * Returns all {@link Permission} entities in the database.
   *
   * @returns Full list of permission rows, unfiltered and unpaginated.
   */
  @SystemLog(ModuleName.Permission)
  execute(): Promise<Permission[]> {
    return this.permissionRepo.findMany();
  }
}