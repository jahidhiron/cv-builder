import { ModuleName } from '@/common/enums';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RemoveRolePermissionProvider {
  constructor(
    private readonly rolePermissionRepo: RolePermissionRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(roleId: number, permissionId: number): Promise<void> {
    const entry = await this.rolePermissionRepo.findOne({ roleId, permissionId });
    if (!entry) {
      await this.errorResponse.notFound({ module: ModuleName.Permission, key: 'role-permission-not-found' });
    }
    await this.rolePermissionRepo.remove({ roleId, permissionId });
  }
}
