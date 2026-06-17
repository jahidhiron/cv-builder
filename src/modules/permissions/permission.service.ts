import { UserPayload } from '@/modules/auth/interfaces';
import { AssignPermissionsDto, CreatePermissionDto, PermissionListQueryDto, UpdatePermissionDto } from '@/modules/permissions/dtos';
import {
  AssignRolePermissionsProvider,
  CreatePermissionProvider,
  DeletePermissionProvider,
  FindOnePermissionProvider,
  ListPermissionsProvider,
  ListRolePermissionsProvider,
  RemoveRolePermissionProvider,
  UpdatePermissionProvider,
} from '@/modules/permissions/providers';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionService {
  constructor(
    private readonly findOnePermissionProvider: FindOnePermissionProvider,
    private readonly createPermissionProvider: CreatePermissionProvider,
    private readonly updatePermissionProvider: UpdatePermissionProvider,
    private readonly deletePermissionProvider: DeletePermissionProvider,
    private readonly listPermissionsProvider: ListPermissionsProvider,
    private readonly listRolePermissionsProvider: ListRolePermissionsProvider,
    private readonly assignRolePermissionsProvider: AssignRolePermissionsProvider,
    private readonly removeRolePermissionProvider: RemoveRolePermissionProvider,
  ) {}

  async findOne(id: number) {
    const permission = await this.findOnePermissionProvider.execute({ id });
    return { permission };
  }

  async create(dto: CreatePermissionDto, user: UserPayload) {
    const permission = await this.createPermissionProvider.execute(dto, user.id);
    return { permission };
  }

  async update(id: number, dto: UpdatePermissionDto, user: UserPayload) {
    const permission = await this.updatePermissionProvider.execute(id, dto, user.id);
    return { permission };
  }

  remove(id: number) {
    return this.deletePermissionProvider.execute(id);
  }

  list(dto: PermissionListQueryDto) {
    return this.listPermissionsProvider.execute(dto);
  }

  async getRolePermissions(roleId: number) {
    const permissions = await this.listRolePermissionsProvider.execute(roleId);
    return { permissions };
  }

  async assignRolePermissions(roleId: number, dto: AssignPermissionsDto) {
    const assigned = await this.assignRolePermissionsProvider.execute(roleId, dto);
    return { assigned };
  }

  removeRolePermission(roleId: number, permissionId: number) {
    return this.removeRolePermissionProvider.execute(roleId, permissionId);
  }
}
