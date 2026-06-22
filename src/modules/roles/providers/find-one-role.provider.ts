import { ModuleName } from '@/common/base/enums';
import { BaseFindOneProvider } from '@/common/base';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Retrieves a single role by any `FindOptionsWhere<Role>` criteria.
 * Throws 404 when no matching role exists.
 */
@Injectable({ scope: Scope.REQUEST })
export class FindOneRoleProvider extends BaseFindOneProvider<Role> {
  constructor(repo: RoleRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Role, repo, errorResponse);
  }
}
