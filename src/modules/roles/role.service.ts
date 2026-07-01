import type { FindOneOptions } from '@/common/base';
import { UserPayload } from '@/modules/auth/interfaces';
import { AssignPermissionsDto } from '@/modules/permissions/dtos';
import { PermissionService } from '@/modules/permissions/permission.service';
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
 * Delegates every operation to its dedicated provider and centralises
 * the `isDeleted: false` constraint for permission-related lookups so
 * callers never need to pass it explicitly.
 *
 * @module Role
 */
@Injectable()
export class RoleService {
  /**
   * @param findOneRoleProvider - Provider for looking up a single role by any condition.
   * @param createRoleProvider - Request-scoped provider for creating roles.
   * @param updateRoleProvider - Request-scoped provider for updating roles.
   * @param deleteRoleProvider - Request-scoped provider for soft- or hard-deleting roles.
   * @param restoreRoleProvider - Request-scoped provider for restoring soft-deleted roles.
   * @param listRolesProvider - Provider for paginated role listings.
   * @param permissionService - Service used for all role–permission operations.
   * @param syncAdminPermissionsProvider - Provider for discovering and syncing Admin permissions.
   */
  constructor(
    private readonly findOneRoleProvider: FindOneRoleProvider,
    private readonly createRoleProvider: CreateRoleProvider,
    private readonly updateRoleProvider: UpdateRoleProvider,
    private readonly deleteRoleProvider: DeleteRoleProvider,
    private readonly restoreRoleProvider: RestoreRoleProvider,
    private readonly listRolesProvider: ListRolesProvider,
    private readonly permissionService: PermissionService,
    private readonly syncAdminPermissionsProvider: SyncAdminPermissionsProvider,
  ) {}

  /**
   * Retrieves a single role matching the given conditions.
   *
   * @param where - TypeORM `FindOptionsWhere<Role>` filter conditions.
   * @param options - Optional relations, column selection, and error-handling toggle (`throwError` defaults to `true`).
   * @returns `{ role }` on success, or `{ role: null }` when `options.throwError` is `false` and no row exists.
   * @throws {NotFoundException} When no matching role is found and `options.throwError` is `true`.
   */
  async findOne<TThrow extends boolean = true>(
    where: FindOptionsWhere<Role>,
    options?: FindOneOptions<Role, TThrow>,
  ): Promise<TThrow extends false ? { role: Role | null } : { role: Role }> {
    const role =
      options?.throwError === false
        ? await this.findOneRoleProvider.execute(where, { throwError: false })
        : await this.findOneRoleProvider.execute(where);
    return { role } as never;
  }

  /**
   * Creates a new role. Stamps `createdBy` / `updatedBy` from the authenticated user.
   *
   * @param dto - Validated creation payload.
   * @returns `{ role }` containing the newly created {@link Role} entity.
   */
  async create(dto: CreateRoleDto) {
    const role = await this.createRoleProvider.execute(dto);
    return { role };
  }

  /**
   * Updates an existing role. Stamps `updatedBy` from the authenticated user.
   *
   * @param where - Conditions identifying the role to update.
   * @param dto - Validated update payload.
   * @returns `{ role }` containing the updated {@link Role} entity.
   */
  async update(where: FindOptionsWhere<Role>, dto: UpdateRoleDto) {
    const role = await this.updateRoleProvider.execute(where, dto);
    return { role };
  }

  /**
   * Soft- or hard-deletes a role. Protected roles (`"user"`, `"admin"`) cannot be deleted.
   *
   * @param where - Conditions identifying the role to delete.
   * @param user - Authenticated user initiating the delete; stamped on the activity log.
   * @param force - When `true`, permanently removes the row; otherwise soft-deletes it.
   */
  remove(where: FindOptionsWhere<Role>, user: UserPayload, force = false) {
    return this.deleteRoleProvider.execute(where, user.id, force);
  }

  /**
   * Restores a previously soft-deleted role.
   *
   * @param where - Conditions identifying the role to restore.
   * @returns `{ role }` containing the restored {@link Role} entity.
   * @throws {BadRequestException} When the role is not currently soft-deleted.
   */
  async restore(where: FindOptionsWhere<Role>) {
    const role = await this.restoreRoleProvider.execute(where);
    return { role };
  }

  /**
   * Returns a paginated list of roles matching the given query.
   *
   * @param dto - Query DTO containing pagination, sorting, and optional search term.
   * @returns A paginated list response.
   */
  list(dto: RoleListQueryDto) {
    return this.listRolesProvider.execute(dto);
  }

  /**
   * Lists all permissions currently assigned to a non-deleted role.
   *
   * @param id - ID of the target role.
   * @returns `{ permissions }` containing the assigned permission entities.
   * @throws {NotFoundException} When no active role with the given ID exists.
   */
  async getPermissions({ id }: { id: number }) {
    const { role } = await this.findOne({ id, isDeleted: false });
    const { permissions } = await this.permissionService.getRolePermissions(role.id);
    return { permissions };
  }

  /**
   * Assigns one or more permissions to a non-deleted role.
   *
   * @param id - ID of the target role.
   * @param dto - DTO containing the permission IDs to assign.
   * @returns `{ assigned }` containing the resulting role–permission records.
   * @throws {NotFoundException} When no active role with the given ID exists.
   */
  async assignPermissions({ id }: { id: number }, dto: AssignPermissionsDto) {
    const { role } = await this.findOne({ id, isDeleted: false });
    const { assigned } = await this.permissionService.assignRolePermissions(role.id, dto);
    return { assigned };
  }

  /**
   * Removes a single permission from a non-deleted role.
   *
   * @param id - ID of the target role.
   * @param permissionId - ID of the permission to remove.
   * @param user - Authenticated user initiating the removal; stamped on the activity log.
   * @throws {NotFoundException} When no active role with the given ID exists.
   */
  async removePermission({ id }: { id: number }, permissionId: number, user: UserPayload) {
    const { role } = await this.findOne({ id, isDeleted: false });
    return this.permissionService.removeRolePermission(role.id, permissionId, user);
  }

  /**
   * Discovers all permission-guarded routes in the running application and syncs
   * them to the Admin role.
   *
   * @param adminUserId - ID of the admin user initiating the sync.
   * @returns `{ syncResult }` with counts of discovered, created, and assigned permissions.
   */
  async syncAdminPermissions({ adminUserId }: { adminUserId: number }) {
    const syncResult = await this.syncAdminPermissionsProvider.execute({ adminUserId });
    return { syncResult };
  }
}
