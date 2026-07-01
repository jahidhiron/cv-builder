import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { UserPayload } from '@/modules/auth/interfaces';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import { FindRolePermissionsByRoleProvider } from '@/modules/permissions/providers/find-role-permissions-by-role.provider';
import type { AssignRolePermissionsParams } from '@/modules/permissions/providers/interfaces';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { In } from 'typeorm';

/**
 * Assigns one or more permissions to a role.
 *
 * Validates all permission IDs in a single batch query; skips IDs that are
 * already assigned to avoid duplicate-key errors. Returns only the newly
 * created `RolePermission` records (not the ones that were already present).
 */
@Injectable({ scope: Scope.REQUEST })
export class AssignRolePermissionsProvider {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly rolePermissionRepo: RolePermissionRepository,
    private readonly findRolePermissions: FindRolePermissionsByRoleProvider,
    private readonly errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Assign a set of permissions to the given role.
   *
   * @param params.roleId - ID of the role receiving the permissions.
   * @param params.dto    - Payload containing the permission IDs to assign.
   * @returns The newly created {@link RolePermission} records.
   *          Already-assigned IDs are silently skipped; an empty array is
   *          returned when every ID was already present.
   * @throws 404 if any permission ID in the payload does not exist.
   */
  @SystemLog(ModuleName.Permission)
  async execute({ roleId, dto }: AssignRolePermissionsParams): Promise<RolePermission[]> {
    const uniqueIds = [...new Set(dto.permissionIds)];

    const found = await this.permissionRepo.findMany({ id: In(uniqueIds) });
    const foundIds = new Set(found.map((p) => p.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      await this.errorResponse.notFound({
        module: ModuleName.Permission,
        key: 'permission-not-found',
      });
    }

    const existing = await this.findRolePermissions.execute({ roleId });
    const existingIds = new Set(existing.map((rp) => Number(rp.permissionId)));

    const toAssign = uniqueIds
      .filter((id) => !existingIds.has(id))
      .map((permissionId) => ({ roleId, permissionId }));

    if (!toAssign.length) return [];

    const assigned = await this.rolePermissionRepo.createMany(toAssign);

    this.activityLog.logUser({
      action: PermissionAction.RolePermissionsAssigned,
      userId: this.request.user?.id,
      metadata: {
        roleId,
        count: assigned.length,
        permissionIds: toAssign.map((a) => a.permissionId),
      },
    });

    return assigned;
  }
}
