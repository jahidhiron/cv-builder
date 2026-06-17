import { ModuleName } from '@/common/enums';
import { CreateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CreateRoleProvider {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(dto: CreateRoleDto, userId: number): Promise<Role> {
    const existing = await this.roleRepo.findOne({ key: dto.key });
    if (existing) {
      await this.errorResponse.conflict({ module: ModuleName.Role, key: 'role-key-exists' });
    }

    return this.roleRepo.create({
      name: dto.name,
      key: dto.key,
      description: dto.description ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
  }
}
