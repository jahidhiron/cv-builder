import { UserPayload } from '@/modules/auth/interfaces';
import { AssignPermissionsDto } from '@/modules/permissions/dtos';
import {
  AssignRolePermissionsProvider,
  ListRolePermissionsProvider,
  RemoveRolePermissionProvider,
} from '@/modules/permissions/providers';
import { CreateRoleDto, RoleListQueryDto, UpdateRoleDto } from '@/modules/roles/dtos';
import {
  CreateRoleProvider,
  DeleteRoleProvider,
  FindOneRoleProvider,
  ListRolesProvider,
  RestoreRoleProvider,
  UpdateRoleProvider,
} from '@/modules/roles/providers';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly findOneRoleProvider: FindOneRoleProvider,
    private readonly createRoleProvider: CreateRoleProvider,
    private readonly updateRoleProvider: UpdateRoleProvider,
    private readonly deleteRoleProvider: DeleteRoleProvider,
    private readonly restoreRoleProvider: RestoreRoleProvider,
    private readonly listRolesProvider: ListRolesProvider,
    private readonly listRolePermissionsProvider: ListRolePermissionsProvider,
    private readonly assignRolePermissionsProvider: AssignRolePermissionsProvider,
    private readonly removeRolePermissionProvider: RemoveRolePermissionProvider,
  ) {}

  findByKey(key: string) {
    return this.roleRepo.findOne({ key });
  }

  async findOne(id: number) {
    const role = await this.findOneRoleProvider.execute({ id });
    return { role };
  }

  async create(dto: CreateRoleDto, user: UserPayload) {
    const role = await this.createRoleProvider.execute(dto, user.id);
    return { role };
  }

  async update(id: number, dto: UpdateRoleDto, user: UserPayload) {
    const role = await this.updateRoleProvider.execute(id, dto, user.id);
    return { role };
  }

  remove(id: number, user: UserPayload, force = false) {
    return this.deleteRoleProvider.execute(id, user.id, force);
  }

  async restore(id: number, user: UserPayload) {
    const role = await this.restoreRoleProvider.execute(id, user.id);
    return { role };
  }

  list(dto: RoleListQueryDto) {
    return this.listRolesProvider.execute(dto);
  }

  async getPermissions(roleId: number) {
    const permissions = await this.listRolePermissionsProvider.execute(roleId);
    return { permissions };
  }

  async assignPermissions(roleId: number, dto: AssignPermissionsDto) {
    const assigned = await this.assignRolePermissionsProvider.execute(roleId, dto);
    return { assigned };
  }

  removePermission(roleId: number, permissionId: number) {
    return this.removeRolePermissionProvider.execute(roleId, permissionId);
  }
}
