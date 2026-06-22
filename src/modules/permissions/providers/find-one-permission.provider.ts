import { ModuleName } from '@/common/base/enums';
import { BaseFindOneProvider } from '@/common/base';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Retrieves a single permission by any `FindOptionsWhere<Permission>` criteria.
 * Throws 404 when no matching permission exists.
 */
@Injectable({ scope: Scope.REQUEST })
export class FindOnePermissionProvider extends BaseFindOneProvider<Permission> {
  constructor(repo: PermissionRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Permission, repo, errorResponse);
  }
}
