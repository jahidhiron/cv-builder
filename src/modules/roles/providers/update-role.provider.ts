import { ModuleName } from '@/common/base/enums';
import { BaseUpdateProvider } from '@/common/base';
import { UserPayload } from '@/modules/auth/interfaces';
import { UpdateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ILike, Not } from 'typeorm';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';
import type { Request } from 'express';

/**
 * Updates a role by ID.
 * Before applying the change, verifies that the new `name` (if provided) does not
 * collide with another existing role — the uniqueness check excludes the current
 * record via `Not(entity.id)`.
 */
@Injectable({ scope: Scope.REQUEST })
export class UpdateRoleProvider extends BaseUpdateProvider<Role, UpdateRoleDto> {
  constructor(
    repo: RoleRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {
    super(ModuleName.Role, repo, errorResponse);
  }

  protected override async beforeUpdate(entity: Role, dto: UpdateRoleDto): Promise<void> {
    if (dto.name) {
      const conflict = await this.repo.findOne({
        name: ILike(dto.name),
        id: Not(entity.id),
      } as FindOptionsWhere<Role>);
      if (conflict) {
        await this.errorResponse.conflict({ module: this.module, key: 'role-name-exists' });
      }
    }
  }

  protected override buildPayload(dto: UpdateRoleDto): DeepPartial<Role> {
    return { ...dto, updatedBy: this.request.user?.id };
  }
}
