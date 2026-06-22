import type { UserPayload } from '@/modules/auth/interfaces';
import { AssignPermissionsDto, CreatePermissionDto, PermissionListQueryDto, UpdatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
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
import type { FindOptionsWhere } from 'typeorm';

/**
 * Facade service for the permissions domain.
 *
 * Delegates each operation to its dedicated provider. Permission management is
 * intentionally separate from roles so that permissions can be defined independently
 * and then assigned to roles via the role–permission join table.
 */
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

  /** Retrieve a single permission by any condition. Throws 404 when not found. */
  async findOne(where: FindOptionsWhere<Permission>) {
    const permission = await this.findOnePermissionProvider.execute(where);
    return { permission };
  }

  /** Create a new permission. The request-scoped provider stamps `createdBy` from the current user. */
  async create(dto: CreatePermissionDto) {
    const permission = await this.createPermissionProvider.execute(dto);
    return { permission };
  }

  /** Update an existing permission. The request-scoped provider stamps `updatedBy` from the current user. */
  async update(where: FindOptionsWhere<Permission>, dto: UpdatePermissionDto) {
    const permission = await this.updatePermissionProvider.execute(where, dto);
    return { permission };
  }

  /** Permanently delete a permission. Throws 404 when not found, 403 for protected keys. */
  remove(where: FindOptionsWhere<Permission>, user: UserPayload) {
    // Permission has no soft-delete columns — force=true always uses hard delete.
    return this.deletePermissionProvider.execute(where, user.id, true);
  }

  /** Return a paginated list of permissions matching the given query. */
  list(dto: PermissionListQueryDto) {
    return this.listPermissionsProvider.execute(dto);
  }

  /** List all permissions currently assigned to the given role. */
  async getRolePermissions(roleId: number) {
    const permissions = await this.listRolePermissionsProvider.execute(roleId);
    return { permissions };
  }

  /** Assign one or more permissions to a role. */
  async assignRolePermissions(roleId: number, dto: AssignPermissionsDto) {
    const assigned = await this.assignRolePermissionsProvider.execute({ roleId, dto });
    return { assigned };
  }

  /** Remove a single permission from a role. */
  removeRolePermission(roleId: number, permissionId: number, user: UserPayload) {
    return this.removeRolePermissionProvider.execute({ roleId, permissionId }, user.id, true);
  }
}
