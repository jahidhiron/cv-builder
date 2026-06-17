import { ModuleName } from '@/common/enums';
import { UpdatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { FindOnePermissionProvider } from '@/modules/permissions/providers/find-one-permission.provider';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { Not } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class UpdatePermissionProvider {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly findOnePermission: FindOnePermissionProvider,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number, dto: UpdatePermissionDto, userId: number): Promise<Permission> {
    await this.findOnePermission.execute({ id });

    if (dto.key) {
      const conflict = await this.permissionRepo.findOne({ key: dto.key, id: Not(id) });
      if (conflict) {
        await this.errorResponse.conflict({ module: ModuleName.Permission, key: 'permission-key-exists' });
      }
    }

    return (await this.permissionRepo.update({ id }, { ...dto, updatedBy: userId }))!;
  }
}
