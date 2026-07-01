import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import type { BulkRemoveRolePermissionsParams } from '@/modules/permissions/providers/interfaces';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';

/**
 * Provider that removes a set of permissions from a role in a single bulk operation.
 *
 * Used by the admin-sync pipeline to prune stale permissions — those whose keys
 * no longer appear in any `@RequirePermissions` decorator and are not protected
 * by the core permission set. Emits a single {@link PermissionAction.RolePermissionsRemoved}
 * activity-log entry covering all removed IDs, avoiding per-row overhead.
 *
 * @module Permission
 */
@Injectable()
export class BulkRemoveRolePermissionsProvider {
  /**
   * @param rolePermissionRepo - Repository used to bulk-delete `role_permissions` rows.
   * @param activityLog - Service used to emit the post-removal activity log entry.
   */
  constructor(
    private readonly rolePermissionRepo: RolePermissionRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Removes `role_permissions` rows matching any combination of `roleId` and `permissionIds`.
   *
   * - `roleId` only → unassigns all permissions from that role.
   * - `permissionIds` only → removes those permissions from every role (used by the delete pipeline).
   * - Both → removes the specified permissions from the specified role.
   *
   * Emits a fire-and-forget {@link PermissionAction.RolePermissionsRemoved} activity-log entry
   * covering all removed IDs after the deletion completes.
   *
   * @param roleId - ID of the role to target. Omit to target all roles.
   * @param permissionIds - IDs of the permissions to remove. Omit to remove all permissions from `roleId`.
   * @param adminUserId - ID of the admin user initiating the removal; stamped on the activity log.
   * @returns The number of {@link RolePermission} records deleted.
   */
  @SystemLog(ModuleName.Permission)
  async execute({ roleId, permissionIds, adminUserId }: BulkRemoveRolePermissionsParams): Promise<number> {
    const removed = await this.rolePermissionRepo.removeMany({
      roleId,
      permissionId: permissionIds ? In(permissionIds) : undefined,
    });

    this.activityLog.logUser({
      action: PermissionAction.RolePermissionsRemoved,
      userId: adminUserId,
      metadata: { roleId, count: removed.length, permissionIds },
    });

    return removed.length;
  }
}
