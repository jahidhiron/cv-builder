import { ModuleName } from '@/common/base/enums';
import { BaseRestoreProvider } from '@/common/base';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Restores a previously soft-deleted role.
 * Throws 400 if the role is not in a deleted state.
 */
@Injectable({ scope: Scope.REQUEST })
export class RestoreRoleProvider extends BaseRestoreProvider<Role> {
  constructor(repo: RoleRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Role, repo, errorResponse);
  }
}
