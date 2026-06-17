import { ModuleName } from '@/common/enums';
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
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';

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
  async create(@Body() dto: CreateRoleDto, @CurrentUser() user: UserPayload) {
    const result = await this.roleService.create(dto, user);
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roleService.findOne(id);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'role-detail', ...result });
  }

  @Patch(':id')
  @UpdateRoleSwaggerDocs()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.roleService.update(id, dto, user);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'update-role', ...result });
  }

  @Patch(':id/restore')
  @RequirePermissions('roles:restore')
  @RestoreRoleSwaggerDocs()
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserPayload) {
    const result = await this.roleService.restore(id, user);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'restore-role', ...result });
  }

  @Delete(':id')
  @DeleteRoleSwaggerDocs()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('force', new ParseBoolPipe({ optional: true })) force: boolean = false,
    @CurrentUser() user: UserPayload,
  ) {
    await this.roleService.remove(id, user, force);
    return this.successResponse.ok({
      module: ModuleName.Role,
      key: force ? 'hard-delete-role' : 'soft-delete-role',
    });
  }

  // ── Role → Permission management ──────────────────────────────────────

  @Get(':id/permissions')
  @RequirePermissions('roles:manage-permissions')
  @GetRolePermissionsSwaggerDocs()
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roleService.getPermissions(id);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'role-permissions-list', ...result });
  }

  @Post(':id/permissions')
  @RequirePermissions('roles:manage-permissions')
  @AssignRolePermissionsSwaggerDocs()
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    const result = await this.roleService.assignPermissions(id, dto);
    return this.successResponse.created({ module: ModuleName.Role, key: 'assign-permissions', ...result });
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('roles:manage-permissions')
  @RemoveRolePermissionSwaggerDocs()
  async removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    await this.roleService.removePermission(id, permissionId);
    return this.successResponse.ok({ module: ModuleName.Role, key: 'remove-permission' });
  }
}
