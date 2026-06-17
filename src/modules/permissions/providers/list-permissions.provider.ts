import { PermissionListQueryDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable, Scope } from '@nestjs/common';
import type { PaginatedResult } from '@/common/repositories/interfaces';

@Injectable({ scope: Scope.REQUEST })
export class ListPermissionsProvider {
  constructor(private readonly permissionRepo: PermissionRepository) {}

  execute(dto: PermissionListQueryDto): Promise<PaginatedResult<Permission>> {
    return this.permissionRepo.paginatedList({
      q: dto.q,
      searchBy: ['name', 'key'],
      page: dto.page,
      limit: dto.limit,
    });
  }
}
