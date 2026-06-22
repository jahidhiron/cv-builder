import { ModuleName } from '@/common/base/enums';
import { BaseDeleteProvider } from '@/common/base';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Soft- or hard-deletes a role.
 * Guards the system-reserved `"user"` and `"admin"` roles — any attempt to delete
 * them results in a 403 Forbidden error.
 */
@Injectable({ scope: Scope.REQUEST })
export class DeleteRoleProvider extends BaseDeleteProvider<Role> {
  constructor(repo: RoleRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Role, repo, errorResponse);
  }

  protected override async beforeDelete(role: Role): Promise<void> {
    if (['user', 'admin'].includes(role.name.toLowerCase())) {
      await this.errorResponse.forbidden({ module: this.module, key: 'role-protected' });
    }
  }
}
