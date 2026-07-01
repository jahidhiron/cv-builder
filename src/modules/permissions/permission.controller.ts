import { ModuleName } from '@/common/base/enums';
import { ParseIdPipe } from '@/common/pipes';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { UserPayload } from '@/modules/auth/interfaces';
import {
  CreatePermissionDto,
  PermissionListQueryDto,
  UpdatePermissionDto,
} from '@/modules/permissions/dtos';
import {
  CreatePermissionSwaggerDocs,
  DeletePermissionSwaggerDocs,
  FindOnePermissionSwaggerDocs,
  ListPermissionsSwaggerDocs,
  UpdatePermissionSwaggerDocs,
} from '@/modules/permissions/swaggers';
import { SuccessResponse } from '@/shared/response';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionService } from './permission.service';

/**
 * REST controller for the permissions resource (`/permissions`).
 *
 * Delegates all business logic to {@link PermissionService} and wraps results
 * in a standardised success envelope. All endpoints require a valid Bearer JWT;
 * fine-grained access is enforced by `PermissionsGuard` using keys embedded in the token.
 *
 * @module Permission
 */
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller(ModuleName.Permission)
export class PermissionController {
  /**
   * @param permissionService - Service delegating all permission domain operations.
   * @param successResponse - Utility for building standardised success responses.
   */
  constructor(
    private readonly permissionService: PermissionService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Creates a new permission.
   *
   * @param dto - Validated creation payload containing `name`, `key`, and optional `description`.
   * @returns A 201 success response containing the created permission.
   * @throws {ConflictException} When the `key` is already in use.
   */
  @Post()
  @CreatePermissionSwaggerDocs()
  async create(@Body() dto: CreatePermissionDto) {
    const result = await this.permissionService.create(dto);
    return this.successResponse.created({
      module: ModuleName.Permission,
      key: 'create-permission',
      ...result,
    });
  }

  /**
   * Returns a paginated list of permissions.
   *
   * @param query - Query DTO containing pagination, sorting, and optional search term.
   * @returns A 200 success response containing the paginated permission list.
   */
  @Get()
  @ListPermissionsSwaggerDocs()
  async list(@Query() query: PermissionListQueryDto) {
    const result = await this.permissionService.list(query);
    return this.successResponse.ok({
      module: ModuleName.Permission,
      key: 'permissions-list',
      ...result,
    });
  }

  /**
   * Returns a single permission by ID.
   *
   * @param id - Permission ID parsed and validated by {@link ParseIdPipe}.
   * @returns A 200 success response containing the permission.
   * @throws {NotFoundException} When no permission with the given ID exists.
   */
  @Get(':id')
  @FindOnePermissionSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.permissionService.findOne({ id });
    return this.successResponse.ok({
      module: ModuleName.Permission,
      key: 'permission-detail',
      ...result,
    });
  }

  /**
   * Updates an existing permission.
   *
   * @param id - Permission ID parsed and validated by {@link ParseIdPipe}.
   * @param dto - Validated update payload; `key` must remain globally unique.
   * @returns A 200 success response containing the updated permission.
   * @throws {NotFoundException} When no permission with the given ID exists.
   * @throws {ConflictException} When the new `key` conflicts with another permission.
   * @throws {ForbiddenException} When the permission is system-reserved.
   */
  @Patch(':id')
  @UpdatePermissionSwaggerDocs()
  async update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdatePermissionDto) {
    const result = await this.permissionService.update({ id }, dto);
    return this.successResponse.ok({
      module: ModuleName.Permission,
      key: 'update-permission',
      ...result,
    });
  }

  /**
   * Permanently deletes a permission by ID.
   *
   * @param id - Permission ID parsed and validated by {@link ParseIdPipe}.
   * @param user - Authenticated user initiating the delete.
   * @returns A 200 success response.
   * @throws {NotFoundException} When no permission with the given ID exists.
   * @throws {ForbiddenException} When the permission key is system-reserved.
   */
  @Delete(':id')
  @DeletePermissionSwaggerDocs()
  async remove(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: UserPayload) {
    await this.permissionService.remove({ id }, user);
    return this.successResponse.ok({ module: ModuleName.Permission, key: 'delete-permission' });
  }
}
