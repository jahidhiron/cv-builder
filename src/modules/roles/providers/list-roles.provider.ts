import { BasePaginatedListProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { PaginatedListParams } from '@/common/base/repositories/interfaces';
import { RoleListQueryDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped provider that returns a paginated list of non-deleted {@link Role} entities.
 *
 * Supports fuzzy search on the `name` column via the `q` query parameter.
 *
 * @module Role
 */
@Injectable({ scope: Scope.REQUEST })
export class ListRolesProvider extends BasePaginatedListProvider<Role, RoleListQueryDto> {
  /**
   * @param repo - Repository for {@link Role} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   */
  constructor(repo: RoleRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Role, repo, errorResponse);
  }

  /**
   * Builds the paginated query parameters for the roles list.
   *
   * Restricts results to non-deleted roles and enables full-text search on `name`.
   *
   * @param dto - Query DTO containing pagination, sorting, and optional search term.
   * @returns A {@link PaginatedListParams} object ready for the base list provider.
   */
  protected override buildParams(dto: RoleListQueryDto): PaginatedListParams<Role> {
    return {
      ...super.buildParams(dto),
      searchBy: ['name'],
      query: { isDeleted: false },
    };
  }
}
