import { ModuleName } from '@/common/base/enums';
import { BaseDeleteProvider } from '@/common/base';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { UserPayload } from '@/modules/auth/interfaces';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FindOptionsWhere } from 'typeorm';
import type { Request } from 'express';

/**
 * Revokes a permission from a role by removing the `RolePermission` join-table entry.
 * Always performs a hard delete since `RolePermission` has no soft-delete columns.
 * Throws 404 when the role–permission assignment does not exist.
 */
@Injectable({ scope: Scope.REQUEST })
export class RemoveRolePermissionProvider extends BaseDeleteProvider<RolePermission> {
  protected override get entityName(): string {
    return 'role-permission';
  }

  constructor(
    repo: RolePermissionRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  @SystemLog(ModuleName.Permission)
  override async execute(where: FindOptionsWhere<RolePermission>, userId: number, force = false): Promise<void> {
    return super.execute(where, userId, force);
  }

  protected override async afterDelete(entity: RolePermission): Promise<void> {
    this.activityLog.logUser({
      action: PermissionAction.RolePermissionRemoved,
      userId: this.request.user?.id,
      metadata: { roleId: Number(entity.roleId), permissionId: Number(entity.permissionId) },
    });
  }
}
