import { RoleListQueryDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { Injectable, Scope } from '@nestjs/common';
import type { PaginatedResult } from '@/common/repositories/interfaces';

@Injectable({ scope: Scope.REQUEST })
export class ListRolesProvider {
  constructor(private readonly roleRepo: RoleRepository) {}

  execute(dto: RoleListQueryDto): Promise<PaginatedResult<Role>> {
    return this.roleRepo.paginatedList({
      q: dto.q,
      searchBy: ['name', 'key'],
      page: dto.page,
      limit: dto.limit,
      query: { isDeleted: false },
    });
  }
}
