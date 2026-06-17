import { ModuleName } from '@/common/enums';
import { CreatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CreatePermissionProvider {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(dto: CreatePermissionDto, userId: number): Promise<Permission> {
    const existing = await this.permissionRepo.findOne({ key: dto.key });
    if (existing) {
      await this.errorResponse.conflict({
        module: ModuleName.Permission,
        key: 'permission-key-exists',
      });
    }

    return this.permissionRepo.create({
      name: dto.name,
      key: dto.key,
      description: dto.description ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
  }
}
