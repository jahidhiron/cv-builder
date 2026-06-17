import { ModuleName } from '@/common/enums';
import { FindOnePermissionProvider } from '@/modules/permissions/providers/find-one-permission.provider';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class DeletePermissionProvider {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly findOnePermission: FindOnePermissionProvider,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number): Promise<void> {
    const permission = await this.findOnePermission.execute({ id });

    if (permission.key.match(/^(roles|users|permissions):/)) {
      await this.errorResponse.forbidden({
        module: ModuleName.Permission,
        key: 'permission-protected',
      });
    }

    await this.permissionRepo.remove({ id });
  }
}
