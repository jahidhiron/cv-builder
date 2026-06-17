import { ModuleName } from '@/common/enums';
import { FindOneRoleProvider } from '@/modules/roles/providers/find-one-role.provider';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class DeleteRoleProvider {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly findOneRole: FindOneRoleProvider,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number, userId: number, force = false): Promise<void> {
    const role = await this.findOneRole.execute({ id });

    if (['user', 'admin'].includes(role.key)) {
      await this.errorResponse.forbidden({ module: ModuleName.Role, key: 'role-protected' });
    }

    if (force) {
      await this.roleRepo.remove({ id });
    } else {
      await this.roleRepo.softDelete({ id }, userId);
    }
  }
}
