import type { FindOneOptions } from '@/common/base';
import type { UserPayload } from '@/modules/auth/interfaces';
import {
  AssignPermissionsDto,
  CreatePermissionDto,
  PermissionListQueryDto,
  UpdatePermissionDto,
} from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { BulkDeletePermissionsProvider } from '@/modules/permissions/providers/bulk-delete-permissions.provider';
import { FindAllPermissionsProvider } from '@/modules/permissions/providers/find-all-permissions.provider';
import type { BulkDeletePermissionsParams } from '@/modules/permissions/providers/interfaces/bulk-delete-permissions.interface';
import { BulkRemoveRolePermissionsProvider } from '@/modules/permissions/providers/bulk-remove-role-permissions.provider';
import type { BulkRemoveRolePermissionsParams } from '@/modules/permissions/providers/interfaces/bulk-remove-role-permissions.interface';
import {
  AssignRolePermissionsProvider,
  CreatePermissionProvider,
  DeletePermissionProvider,
  FindOnePermissionProvider,
  FindPermissionKeysByRoleProvider,
  ListPermissionsProvider,
  ListRolePermissionsProvider,
  RemoveRolePermissionProvider,
  UpdatePermissionProvider,
  UpsertPermissionProvider,
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
    private readonly bulkRemoveRolePermissionsProvider: BulkRemoveRolePermissionsProvider,
    private readonly bulkDeletePermissionsProvider: BulkDeletePermissionsProvider,
    private readonly findAllPermissionsProvider: FindAllPermissionsProvider,
    private readonly findPermissionKeysByRoleProvider: FindPermissionKeysByRoleProvider,
    private readonly upsertPermissionProvider: UpsertPermissionProvider,
  ) {}

  /** Retrieve a single permission by any condition. Throws 404 when not found. */
  async findOne<TThrow extends boolean = true>(
    where: FindOptionsWhere<Permission>,
    options?: FindOneOptions<Permission, TThrow>,
  ): Promise<
    TThrow extends false ? { permission: Permission | null } : { permission: Permission }
  > {
    const permission =
      options?.throwError === false
        ? await this.findOnePermissionProvider.execute(where, { throwError: false })
        : await this.findOnePermissionProvider.execute(where);
    return { permission } as never;
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
    return this.deletePermissionProvider.execute(where, user.id, true);
  }

  /** Return a paginated list of permissions matching the given query. */
  list(dto: PermissionListQueryDto) {
    return this.listPermissionsProvider.execute(dto);
  }

  /** Resolve the permission key strings for a role; returns `{ permissions: [] }` when `roleId` is absent. */
  async findPermissionKeys(roleId: number | null | undefined): Promise<{ permissions: string[] }> {
    if (!roleId) return { permissions: [] };
    const permissions = await this.findPermissionKeysByRoleProvider.execute({ roleId });
    return { permissions };
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

  /**
   * Removes multiple permissions from a role in a single bulk operation.
   *
   * Used by the admin-sync pipeline to unassign stale permissions (keys no longer
   * present in the codebase and not protected by the core permission set).
   *
   * @param params.roleId - ID of the role to unassign from.
   * @param params.permissionIds - IDs of the permissions to remove.
   * @param params.adminUserId - ID of the admin user initiating the operation; stamped on the activity log.
   * @returns The number of role–permission records deleted.
   */
  unassignRolePermissions({ roleId, permissionIds, adminUserId }: BulkRemoveRolePermissionsParams): Promise<number> {
    return this.bulkRemoveRolePermissionsProvider.execute({ roleId, permissionIds, adminUserId });
  }

  /**
   * Permanently deletes orphaned permissions and all their role assignments.
   *
   * Used by the admin-sync pipeline. Removes `role_permissions` rows first (across
   * all roles) then deletes the `permissions` rows to satisfy the FK constraint.
   *
   * @param permissionIds - IDs of the orphaned permissions to delete.
   * @param adminUserId - ID of the admin user initiating the deletion; stamped on the activity log.
   * @returns The number of {@link Permission} rows permanently deleted.
   */
  bulkDeletePermissions({ permissionIds, adminUserId }: BulkDeletePermissionsParams): Promise<number> {
    return this.bulkDeletePermissionsProvider.execute({ permissionIds, adminUserId });
  }

  /**
   * Returns all permission rows in the database with no filters.
   *
   * Used by the admin-sync pipeline to identify orphaned keys across the full
   * permissions table, not just those assigned to a specific role.
   *
   * @returns Full list of {@link Permission} entities.
   */
  findAllPermissions() {
    return this.findAllPermissionsProvider.execute();
  }

  /**
   * Batch-upserts permissions for the admin permission sync flow.
   *
   * Fetches existing permissions by key in one query, then inserts only the
   * missing ones in a single bulk insert. Two DB calls total regardless of
   * the number of items.
   *
   * @param items       - Permission keys and display names to upsert.
   * @param adminUserId - ID stamped on `createdBy` / `updatedBy` for new rows.
   * @returns `permissionIds` — IDs of all permissions (existing + new);
   *          `created` — number of rows inserted in this call.
   */
  upsertPermissions({
    items,
    adminUserId,
  }: {
    items: { key: string; name: string }[];
    adminUserId: number;
  }): Promise<{ permissionIds: number[]; created: number }> {
    return this.upsertPermissionProvider.execute({ items, adminUserId });
  }
}
