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
 */
@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly successResponse: SuccessResponse,
  ) {}

  @Post()
  @CreateRoleSwaggerDocs()
  async create(@Body() dto: CreateRoleDto) {
    const result = await this.roleService.create(dto);
    return this.successResponse.created({ module: ModuleName.Role, key: 'create-role', ...result });
  }

  @Get()
  @ListRolesSwaggerDocs()
  async list(@Query() query: RoleListQueryDto) {
    const result = await this.roleService.list(query);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'roles-list', ...result });
  }

  @Get(':id')
  @FindOneRoleSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.roleService.findOne({ id, isDeleted: false });
    return this.successResponse.ok({ module: ModuleName.Role, key: 'role-detail', ...result });
  }

  @Patch(':id')
  @UpdateRoleSwaggerDocs()
  async update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateRoleDto) {
    const result = await this.roleService.update({ id }, dto);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'update-role', ...result });
  }

  @Patch(':id/restore')
  @RequirePermissions('roles:restore')
  @RestoreRoleSwaggerDocs()
  async restore(@Param('id', ParseIdPipe) id: number) {
    const result = await this.roleService.restore({ id });
    return this.successResponse.ok({ module: ModuleName.Role, key: 'restore-role', ...result });
  }

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

  @Post('sync-admin-permissions')
  @RequirePermissions('roles:manage-permissions')
  @SyncAdminPermissionsSwaggerDocs()
  async syncAdminPermissions(@CurrentUser() user: UserPayload) {
    const result = await this.roleService.syncAdminPermissions(user.id);
    return this.successResponse.created({
      module: ModuleName.Role,
      key: 'sync-admin-permissions',
      ...result,
    });
  }

  @Get(':id/permissions')
  @RequirePermissions('roles:manage-permissions')
  @GetRolePermissionsSwaggerDocs()
  async getPermissions(@Param('id', ParseIdPipe) id: number) {
    const result = await this.roleService.getPermissions({ id, isDeleted: false });
    return this.successResponse.ok({
      module: ModuleName.Role,
      key: 'role-permissions-list',
      ...result,
    });
  }

  @Post(':id/permissions')
  @RequirePermissions('roles:manage-permissions')
  @AssignRolePermissionsSwaggerDocs()
  async assignPermissions(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    const result = await this.roleService.assignPermissions({ id, isDeleted: false }, dto);
    return this.successResponse.created({
      module: ModuleName.Role,
      key: 'assign-permissions',
      ...result,
    });
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('roles:manage-permissions')
  @RemoveRolePermissionSwaggerDocs()
  async removePermission(
    @Param('id', ParseIdPipe) id: number,
    @Param('permissionId', ParseIdPipe) permissionId: number,
    @CurrentUser() user: UserPayload,
  ) {
    await this.roleService.removePermission({ id, isDeleted: false }, permissionId, user);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'remove-permission' });
  }
}
