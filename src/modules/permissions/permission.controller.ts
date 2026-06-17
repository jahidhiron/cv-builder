import { ModuleName } from '@/common/enums';
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
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionService } from './permission.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller(ModuleName.Permission)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly successResponse: SuccessResponse,
  ) {}

  @Post()
  @CreatePermissionSwaggerDocs()
  async create(@Body() dto: CreatePermissionDto, @CurrentUser() user: UserPayload) {
    const result = await this.permissionService.create(dto, user);
    return this.successResponse.created({
      module: ModuleName.Permission,
      key: 'create-permission',
      ...result,
    });
  }

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

  @Get(':id')
  @FindOnePermissionSwaggerDocs()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.permissionService.findOne(id);
    return this.successResponse.ok({
      module: ModuleName.Permission,
      key: 'permission-detail',
      ...result,
    });
  }

  @Patch(':id')
  @UpdatePermissionSwaggerDocs()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.permissionService.update(id, dto, user);
    return this.successResponse.ok({
      module: ModuleName.Permission,
      key: 'update-permission',
      ...result,
    });
  }

  @Delete(':id')
  @DeletePermissionSwaggerDocs()
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionService.remove(id);
    return this.successResponse.ok({ module: ModuleName.Permission, key: 'delete-permission' });
  }
}
