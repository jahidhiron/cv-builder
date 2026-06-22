import { BaseUpdateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { UpdatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { DeepPartial } from 'typeorm';
import { Not } from 'typeorm';
import type { Request } from 'express';

/**
 * Updates a permission by ID.
 * If the DTO includes a new `key`, checks that no other permission already owns
 * that key (excludes the current record via `Not(entity.id)`).
 */
@Injectable({ scope: Scope.REQUEST })
export class UpdatePermissionProvider extends BaseUpdateProvider<Permission, UpdatePermissionDto> {
  constructor(
    repo: PermissionRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  protected override async beforeUpdate(entity: Permission, dto: UpdatePermissionDto): Promise<void> {
    if (entity.key.match(/^(roles|users|permissions):/)) {
      await this.errorResponse.forbidden({ module: this.module, key: 'permission-protected' });
    }
    if (dto.key) {
      const conflict = await this.repo.findOne({ key: dto.key, id: Not(entity.id) });
      if (conflict) {
        await this.errorResponse.conflict({ module: this.module, key: 'permission-key-exists' });
      }
    }
  }

  protected override buildPayload(dto: UpdatePermissionDto): DeepPartial<Permission> {
    return { ...dto, updatedBy: this.request.user?.id };
  }
}
