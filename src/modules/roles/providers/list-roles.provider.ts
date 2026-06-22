import { ModuleName } from '@/common/base/enums';
import { BasePaginatedListProvider } from '@/common/base';
import { PaginatedListParams } from '@/common/base/repositories/interfaces';
import { RoleListQueryDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Returns a paginated list of non-deleted roles.
 * Supports fuzzy search on the `name` column via the `q` query parameter.
 */
@Injectable({ scope: Scope.REQUEST })
export class ListRolesProvider extends BasePaginatedListProvider<Role, RoleListQueryDto> {
  constructor(repo: RoleRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Role, repo, errorResponse);
  }

  protected override buildParams(dto: RoleListQueryDto): PaginatedListParams<Role> {
    return {
      ...super.buildParams(dto),
      searchBy: ['name'],
      query: { isDeleted: false },
    };
  }
}
