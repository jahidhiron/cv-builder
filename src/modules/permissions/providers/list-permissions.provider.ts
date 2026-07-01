import { BasePaginatedListProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { PaginatedListParams } from '@/common/base/repositories/interfaces';
import { PermissionListQueryDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped provider that returns a paginated list of all {@link Permission} entities.
 *
 * Supports fuzzy search across both the `name` and `key` columns via the `q` query parameter.
 *
 * @module Permission
 */
@Injectable({ scope: Scope.REQUEST })
export class ListPermissionsProvider extends BasePaginatedListProvider<
  Permission,
  PermissionListQueryDto
> {
  /**
   * @param repo - Repository for {@link Permission} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   */
  constructor(repo: PermissionRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  /**
   * Builds the paginated query parameters for the permissions list.
   *
   * Enables full-text search on both `name` and `key` columns.
   *
   * @param dto - Query DTO containing pagination, sorting, and optional search term.
   * @returns A {@link PaginatedListParams} object ready for the base list provider.
   */
  protected override buildParams(dto: PermissionListQueryDto): PaginatedListParams<Permission> {
    return {
      ...super.buildParams(dto),
      searchBy: ['name', 'key'],
    };
  }
}
