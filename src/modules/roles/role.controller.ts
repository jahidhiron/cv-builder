import { ModuleName } from '@/common/base/enums';
import { ParseIdPipe } from '@/common/pipes';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@/modules/auth/decorators/require-permissions.decorator';
import type { UserPayload } from '@/modules/auth/interfaces';
import { AssignPermissionsDto } from '@/modules/permissions/dtos';
import { CreateRoleDto, RoleListQueryDto, UpdateRoleDto } from '@/modules/roles/dtos';
import {
  AssignRolePermissionsSwaggerDocs,
  CreateRoleSwaggerDocs,
  DeleteRoleSwaggerDocs,
  FindOneRoleSwaggerDocs,
  GetRolePermissionsSwaggerDocs,
  ListRolesSwaggerDocs,
  RemoveRolePermissionSwaggerDocs,
  RestoreRoleSwaggerDocs,
  SyncAdminPermissionsSwaggerDocs,
  UpdateRoleSwaggerDocs,
} from '@/modules/roles/swaggers';
import { SuccessResponse } from '@/shared/response';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';

/**
 * REST controller for role management and role–permission assignments.
 *
 * All endpoints require a valid bearer token. Individual route handlers are
 * guarded by granular `@RequirePermissions(...)` decorators where applicable.
 *
 * @module Role
 */
@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  /**
   * @param roleService - Service delegating all role domain operations.
   * @param successResponse - Utility for building standardised success responses.
   */
  constructor(
    private readonly roleService: RoleService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Creates a new role.
   *
   * @param dto - Validated role creation payload.
   * @returns A 201 success response containing the created role.
   */
  @Post()
  @CreateRoleSwaggerDocs()
  async create(@Body() dto: CreateRoleDto) {
    const result = await this.roleService.create(dto);
    return this.successResponse.created({ module: ModuleName.Role, key: 'create-role', ...result });
  }

  /**
   * Returns a paginated list of roles.
   *
   * @param query - Query DTO containing pagination, sorting, and optional search term.
   * @returns A 200 success response containing the paginated role list.
   */
  @Get()
  @ListRolesSwaggerDocs()
  async list(@Query() query: RoleListQueryDto) {
    const result = await this.roleService.list(query);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'roles-list', ...result });
  }

  /**
   * Returns a single role by ID, including soft-deleted ones.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @returns A 200 success response containing the role.
   * @throws {NotFoundException} When no role with the given ID exists.
   */
  @Get(':id')
  @FindOneRoleSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.roleService.findOne({ id });
    return this.successResponse.ok({ module: ModuleName.Role, key: 'role-detail', ...result });
  }

  /**
   * Updates an existing role.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @param dto - Validated update payload.
   * @returns A 200 success response containing the updated role.
   */
  @Patch(':id')
  @UpdateRoleSwaggerDocs()
  async update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateRoleDto) {
    const result = await this.roleService.update({ id }, dto);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'update-role', ...result });
  }

  /**
   * Restores a previously soft-deleted role.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @returns A 200 success response containing the restored role.
   * @throws {BadRequestException} When the role is not currently soft-deleted.
   */
  @Patch(':id/restore')
  @RequirePermissions('roles:restore')
  @RestoreRoleSwaggerDocs()
  async restore(@Param('id', ParseIdPipe) id: number) {
    const result = await this.roleService.restore({ id });
    return this.successResponse.ok({ module: ModuleName.Role, key: 'restore-role', ...result });
  }

  /**
   * Soft- or hard-deletes a role. Protected roles (`"user"`, `"admin"`) cannot be deleted.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @param force - When `true`, permanently removes the row; otherwise soft-deletes it.
   * @param user - Authenticated user initiating the delete.
   * @returns A 200 success response.
   * @throws {ForbiddenException} When the target role is system-reserved.
   */
  @Delete(':id')
  @DeleteRoleSwaggerDocs()
  async remove(
    @Param('id', ParseIdPipe) id: number,
    @Query('force', new ParseBoolPipe({ optional: true })) force: boolean = false,
    @CurrentUser() user: UserPayload,
  ) {
    await this.roleService.remove({ id }, user, force);
    return this.successResponse.ok({
      module: ModuleName.Role,
      key: force ? 'hard-delete-role' : 'soft-delete-role',
    });
  }

  /**
   * Discovers all permission-guarded routes and syncs them to the Admin role.
   *
   * @param user - Authenticated admin user initiating the sync.
   * @returns A 201 success response containing the sync result summary.
   */
  @Post('sync-admin-permissions')
  @RequirePermissions('roles:manage-permissions')
  @SyncAdminPermissionsSwaggerDocs()
  async syncAdminPermissions(@CurrentUser() user: UserPayload) {
    const result = await this.roleService.syncAdminPermissions({ adminUserId: user.id });
    return this.successResponse.created({
      module: ModuleName.Role,
      key: 'sync-admin-permissions',
      ...result,
    });
  }

  /**
   * Lists all permissions assigned to a role.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @returns A 200 success response containing the assigned permissions.
   * @throws {NotFoundException} When no active role with the given ID exists.
   */
  @Get(':id/permissions')
  @RequirePermissions('roles:manage-permissions')
  @GetRolePermissionsSwaggerDocs()
  async getPermissions(@Param('id', ParseIdPipe) id: number) {
    const result = await this.roleService.getPermissions({ id });
    return this.successResponse.ok({
      module: ModuleName.Role,
      key: 'role-permissions-list',
      ...result,
    });
  }

  /**
   * Assigns one or more permissions to a role.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @param dto - DTO containing the permission IDs to assign.
   * @returns A 201 success response containing the assigned role–permission records.
   * @throws {NotFoundException} When no active role with the given ID exists.
   */
  @Post(':id/permissions')
  @RequirePermissions('roles:manage-permissions')
  @AssignRolePermissionsSwaggerDocs()
  async assignPermissions(@Param('id', ParseIdPipe) id: number, @Body() dto: AssignPermissionsDto) {
    const result = await this.roleService.assignPermissions({ id }, dto);
    return this.successResponse.created({
      module: ModuleName.Role,
      key: 'assign-permissions',
      ...result,
    });
  }

  /**
   * Removes a single permission from a role.
   *
   * @param id - Role ID parsed and validated by {@link ParseIdPipe}.
   * @param permissionId - Permission ID parsed and validated by {@link ParseIdPipe}.
   * @param user - Authenticated user initiating the removal.
   * @returns A 200 success response.
   * @throws {NotFoundException} When no active role with the given ID exists.
   */
  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('roles:manage-permissions')
  @RemoveRolePermissionSwaggerDocs()
  async removePermission(
    @Param('id', ParseIdPipe) id: number,
    @Param('permissionId', ParseIdPipe) permissionId: number,
    @CurrentUser() user: UserPayload,
  ) {
    await this.roleService.removePermission({ id }, permissionId, user);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'remove-permission' });
  }
}
