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
 * Handles HTTP routing and response serialisation for all permission CRUD operations.
 * Each action delegates business logic to {@link PermissionService} and wraps the result
 * in a standardised success envelope via {@link SuccessResponse}.
 *
 * All endpoints require a valid Bearer JWT. Fine-grained access control is enforced by
 * `PermissionsGuard` using the permission keys embedded in the token at sign-in.
 */
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller(ModuleName.Permission)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Create a new permission.
   *
   * @param dto - Validated request body with `name`, `key`, and optional `description`.
   * @returns 201 Created with the newly created permission in the standard envelope.
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
   * List permissions with optional search and pagination.
   *
   * @param query - Pagination, search, and sort parameters.
   * @returns 200 OK with a paginated array of permissions and metadata.
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
   * Retrieve a single permission by its numeric ID.
   *
   * @param id - The permission's primary key, parsed from the URL path.
   * @returns 200 OK with the matching permission, or 404 if it does not exist.
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
   * Partially update a permission by ID.
   *
   * @param id - The permission's primary key, parsed from the URL path.
   * @param dto - Fields to update (all optional). `key` must remain globally unique.
   * @returns 200 OK with the updated permission, or 404/409 on validation failures.
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
   * Hard-delete a permission by ID.
   *
   * @param id - The permission's primary key, parsed from the URL path.
   * @param user - The currently authenticated user injected by `CurrentUser`.
   * @returns 200 OK on success, 404 if not found, or 403 for system-protected keys.
   */
  @Delete(':id')
  @DeletePermissionSwaggerDocs()
  async remove(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: UserPayload) {
    await this.permissionService.remove({ id }, user);
    return this.successResponse.ok({ module: ModuleName.Permission, key: 'delete-permission' });
  }
}
