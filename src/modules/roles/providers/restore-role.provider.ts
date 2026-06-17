import { ModuleName } from '@/common/enums';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RestoreRoleProvider {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({ id });

    if (!role) {
      await this.errorResponse.notFound({ module: ModuleName.Role, key: 'role-not-found' });
    }
    if (!role!.isDeleted) {
      await this.errorResponse.badRequest({ module: ModuleName.Role, key: 'role-not-archived' });
    }

    const restored = await this.roleRepo.restore({ id });
    return restored!;
  }
}
