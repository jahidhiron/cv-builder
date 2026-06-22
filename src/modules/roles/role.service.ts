import { UserPayload } from '@/modules/auth/interfaces';
import { AssignPermissionsDto } from '@/modules/permissions/dtos';
import {
  AssignRolePermissionsProvider,
  ListRolePermissionsProvider,
  RemoveRolePermissionProvider,
} from '@/modules/permissions/providers';
import { CreateRoleDto, RoleListQueryDto, UpdateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import {
  CreateRoleProvider,
  DeleteRoleProvider,
  FindOneRoleProvider,
  ListRolesProvider,
  RestoreRoleProvider,
  SyncAdminPermissionsProvider,
  UpdateRoleProvider,
} from '@/modules/roles/providers';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Facade service for the roles domain.
 *
 * Delegates each operation to its dedicated provider.
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly findOneRoleProvider: FindOneRoleProvider,
    private readonly createRoleProvider: CreateRoleProvider,
    private readonly updateRoleProvider: UpdateRoleProvider,
    private readonly deleteRoleProvider: DeleteRoleProvider,
    private readonly restoreRoleProvider: RestoreRoleProvider,
    private readonly listRolesProvider: ListRolesProvider,
    private readonly listRolePermissionsProvider: ListRolePermissionsProvider,
    private readonly assignRolePermissionsProvider: AssignRolePermissionsProvider,
    private readonly removeRolePermissionProvider: RemoveRolePermissionProvider,
    private readonly syncAdminPermissionsProvider: SyncAdminPermissionsProvider,
  ) {}

  /** Retrieve a single non-deleted role by any condition. Throws 404 when not found. */
  async findOne(where: FindOptionsWhere<Role>) {
    const role = await this.findOneRoleProvider.execute(where);
    return { role };
  }

  /** Create a new role. The request-scoped provider stamps `createdBy` from the current user. */
  async create(dto: CreateRoleDto) {
    const role = await this.createRoleProvider.execute(dto);
    return { role };
  }

  /** Update an existing role. The request-scoped provider stamps `updatedBy` from the current user. */
  async update(where: FindOptionsWhere<Role>, dto: UpdateRoleDto) {
    const role = await this.updateRoleProvider.execute(where, dto);
    return { role };
  }

  /**
   * Delete a role.
   * @param force - When `true`, permanently removes the row; otherwise soft-deletes it.
   */
  remove(where: FindOptionsWhere<Role>, user: UserPayload, force = false) {
    return this.deleteRoleProvider.execute(where, user.id, force);
  }

  /** Restore a previously soft-deleted role. Throws 400 if the role is not archived. */
  async restore(where: FindOptionsWhere<Role>) {
    const role = await this.restoreRoleProvider.execute(where);
    return { role };
  }

  /** Return a paginated list of roles matching the given query. */
  list(dto: RoleListQueryDto) {
    return this.listRolesProvider.execute(dto);
  }

  /** List all permissions currently assigned to a role. */
  async getPermissions(where: FindOptionsWhere<Role>) {
    const { role } = await this.findOne(where);
    const permissions = await this.listRolePermissionsProvider.execute(role.id);
    return { permissions };
  }

  /** Assign one or more permissions to a role. */
  async assignPermissions(where: FindOptionsWhere<Role>, dto: AssignPermissionsDto) {
    const { role } = await this.findOne(where);
    const assigned = await this.assignRolePermissionsProvider.execute({ roleId: role.id, dto });
    return { assigned };
  }

  /** Remove a single permission from a role. */
  async removePermission(where: FindOptionsWhere<Role>, permissionId: number, user: UserPayload) {
    const { role } = await this.findOne(where);
    return this.removeRolePermissionProvider.execute({ roleId: role.id, permissionId }, user.id, true);
  }

  /** Discover all private routes and sync their permissions to the Admin role. */
  syncAdminPermissions(adminUserId: number) {
    return this.syncAdminPermissionsProvider.execute(adminUserId);
  }
}
