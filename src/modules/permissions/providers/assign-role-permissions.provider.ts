import { ModuleName } from '@/common/enums';
import { AssignPermissionsDto } from '@/modules/permissions/dtos';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class AssignRolePermissionsProvider {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly rolePermissionRepo: RolePermissionRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(roleId: number, dto: AssignPermissionsDto): Promise<RolePermission[]> {
    const existing = await this.rolePermissionRepo.findByRole(roleId);
    const existingIds = new Set(existing.map((rp) => rp.permissionId));

    const toAssign: number[] = [];
    for (const permissionId of dto.permissionIds) {
      const permission = await this.permissionRepo.findOne({ id: permissionId });
      if (!permission) {
        await this.errorResponse.notFound({ module: ModuleName.Permission, key: 'permission-not-found' });
      }
      if (!existingIds.has(permissionId)) {
        toAssign.push(permissionId);
      }
    }

    const created: RolePermission[] = [];
    for (const permissionId of toAssign) {
      const entry = await this.rolePermissionRepo.create({ roleId, permissionId });
      created.push(entry);
    }

    return created;
  }
}
