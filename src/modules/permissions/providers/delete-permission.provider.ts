import { ModuleName } from '@/common/base/enums';
import { BaseDeleteProvider } from '@/common/base';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Deletes a permission by ID (always a hard delete — `Permission` has no soft-delete columns).
 * System-owned permissions whose keys start with `roles:`, `users:`, or `permissions:`
 * are protected and will result in a 403 Forbidden error.
 */
@Injectable({ scope: Scope.REQUEST })
export class DeletePermissionProvider extends BaseDeleteProvider<Permission> {
  constructor(repo: PermissionRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  protected override async beforeDelete(permission: Permission): Promise<void> {
    if (permission.key.match(/^(roles|users|permissions):/)) {
      await this.errorResponse.forbidden({ module: this.module, key: 'permission-protected' });
    }
  }
}
