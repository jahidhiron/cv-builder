import { ModuleName } from '@/common/enums';
import { UpdateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { FindOneRoleProvider } from '@/modules/roles/providers/find-one-role.provider';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { Not } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class UpdateRoleProvider {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly findOneRole: FindOneRoleProvider,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number, dto: UpdateRoleDto, userId: number): Promise<Role> {
    await this.findOneRole.execute({ id });

    if (dto.key) {
      const conflict = await this.roleRepo.findOne({ key: dto.key, id: Not(id) });
      if (conflict) {
        await this.errorResponse.conflict({ module: ModuleName.Role, key: 'role-key-exists' });
      }
    }

    return (await this.roleRepo.update({ id }, { ...dto, updatedBy: userId }))!;
  }
}
