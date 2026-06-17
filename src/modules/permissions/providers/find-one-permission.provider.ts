import { ModuleName } from '@/common/enums';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class FindOnePermissionProvider {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(where: FindOptionsWhere<Permission>): Promise<Permission> {
    const permission = await this.permissionRepo.findOne(where);
    if (!permission) {
      await this.errorResponse.notFound({ module: ModuleName.Permission, key: 'permission-not-found' });
    }
    return permission!;
  }
}
