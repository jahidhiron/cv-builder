import { ModuleName } from '@/common/base/enums';
import { BaseDeleteProvider } from '@/common/base';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

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

  constructor(repo: RolePermissionRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Permission, repo, errorResponse);
  }
}
