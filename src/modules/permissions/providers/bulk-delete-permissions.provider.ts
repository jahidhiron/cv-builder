import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import { BulkRemoveRolePermissionsProvider } from '@/modules/permissions/providers/bulk-remove-role-permissions.provider';
import type { BulkDeletePermissionsParams } from '@/modules/permissions/providers/interfaces';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';

/**
 * Provider that permanently deletes a set of orphaned permissions and all their
 * associated role–permission assignments across every role.
 *
 * Used by the admin-sync pipeline to prune {@link Permission} rows whose keys
 * no longer appear in any `@RequirePermissions` decorator and are not protected
 * by the core migration-seeded set. The deletion is performed in two steps:
 * 1. All `role_permissions` rows referencing the orphaned IDs are removed first
 *    to satisfy the foreign-key constraint.
 * 2. The `permissions` rows are then permanently deleted.
 *
 * Emits a single {@link PermissionAction.PermissionsBulkDeleted} activity-log entry.
 *
 * @module Permission
 */
@Injectable()
export class BulkDeletePermissionsProvider {
  /**
   * @param permissionRepo - Repository used to bulk-delete `permissions` rows.
   * @param bulkRemoveRolePermissionsProvider - Provider used to remove all `role_permissions` rows for the orphaned IDs.
   * @param activityLog - Service used to emit the post-deletion activity log entry.
   */
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly bulkRemoveRolePermissionsProvider: BulkRemoveRolePermissionsProvider,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Permanently deletes the given permissions and all their role assignments.
   *
   * @param permissionIds - IDs of the orphaned permissions to delete.
   * @param adminUserId - ID of the admin user initiating the deletion; stamped on the activity log.
   * @returns The number of {@link Permission} rows permanently deleted.
   */
  @SystemLog(ModuleName.Permission)
  async execute({ permissionIds, adminUserId }: BulkDeletePermissionsParams): Promise<number> {
    if (!permissionIds.length) return 0;

    await this.bulkRemoveRolePermissionsProvider.execute({ permissionIds, adminUserId });

    const deleted = await this.permissionRepo.removeMany({ id: In(permissionIds) });

    this.activityLog.logUser({
      action: PermissionAction.PermissionsBulkDeleted,
      userId: adminUserId,
      metadata: { count: deleted.length, permissionIds },
    });

    return deleted.length;
  }
}
