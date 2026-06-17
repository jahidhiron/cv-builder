import { ModuleName } from '@/common/enums';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class FindOneRoleProvider {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(where: FindOptionsWhere<Role>, includeDeleted = false): Promise<Role> {
    const role = await this.roleRepo.findOne(where);
    if (!role || (!includeDeleted && role.isDeleted)) {
      await this.errorResponse.notFound({ module: ModuleName.Role, key: 'role-not-found' });
    }
    return role!;
  }
}
