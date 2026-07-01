import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { FindRolePermissionsByRoleParams } from '@/modules/permissions/providers/interfaces';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { Injectable } from '@nestjs/common';

/**
 * Returns all `RolePermission` join-table records for a given role.
 * Used to check existing assignments before inserting new ones.
 */
@Injectable()
export class FindRolePermissionsByRoleProvider {
  constructor(
    private readonly rolePermissionRepo: RolePermissionRepository,
  ) {}

  @SystemLog(ModuleName.Permission)
  async execute({ roleId }: FindRolePermissionsByRoleParams): Promise<RolePermission[]> {
    const { items } = await this.rolePermissionRepo.list({ query: { roleId } });
    return items;
  }
}
