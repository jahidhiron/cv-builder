import { ModuleName } from '@/common/base/enums';
import { BasePaginatedListProvider } from '@/common/base';
import { PaginatedListParams } from '@/common/base/repositories/interfaces';
import { PermissionListQueryDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Returns a paginated list of all permissions.
 * Supports fuzzy search across both `name` and `key` columns.
 */
@Injectable({ scope: Scope.REQUEST })
export class ListPermissionsProvider extends BasePaginatedListProvider<Permission, PermissionListQueryDto> {
  constructor(repo: PermissionRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  protected override buildParams(dto: PermissionListQueryDto): PaginatedListParams<Permission> {
    return {
      ...super.buildParams(dto),
      searchBy: ['name', 'key'],
    };
  }
}
