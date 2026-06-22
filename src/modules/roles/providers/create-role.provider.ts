import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base';
import { UserPayload } from '@/modules/auth/interfaces';
import { CreateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ILike } from 'typeorm';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';
import type { Request } from 'express';

/**
 * Creates a new role after a case-insensitive uniqueness check on `name`.
 * Extends `BaseCreateProvider` — all audit fields (`createdBy`, `updatedBy`) are
 * stamped from the request-scoped current user.
 */
@Injectable({ scope: Scope.REQUEST })
export class CreateRoleProvider extends BaseCreateProvider<Role, CreateRoleDto> {
  constructor(
    repo: RoleRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {
    super(ModuleName.Role, repo, errorResponse);
  }

  protected override async beforeCreate(dto: CreateRoleDto): Promise<void> {
    const existing = await this.repo.findOne({ name: ILike(dto.name) } as FindOptionsWhere<Role>);
    if (existing) {
      await this.errorResponse.conflict({ module: this.module, key: 'role-name-exists' });
    }
  }

  protected override buildPayload(dto: CreateRoleDto): DeepPartial<Role> {
    const userId = this.request.user?.id;
    return { ...dto, createdBy: userId, updatedBy: userId };
  }
}
