import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base';
import { UserPayload } from '@/modules/auth/interfaces';
import { CreatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { DeepPartial } from 'typeorm';
import type { Request } from 'express';

/**
 * Creates a new permission after verifying the `key` is globally unique.
 * Permission keys follow the `domain:action` convention (e.g. `users:read`)
 * and are embedded in JWTs at sign-in, so they must be stable and unique.
 */
@Injectable({ scope: Scope.REQUEST })
export class CreatePermissionProvider extends BaseCreateProvider<Permission, CreatePermissionDto> {
  constructor(
    repo: PermissionRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  protected override async beforeCreate(dto: CreatePermissionDto): Promise<void> {
    const existing = await this.repo.findOne({ key: dto.key });
    if (existing) {
      await this.errorResponse.conflict({ module: this.module, key: 'permission-key-exists' });
    }
  }

  protected override buildPayload(dto: CreatePermissionDto): DeepPartial<Permission> {
    const userId = this.request.user?.id;
    return { ...dto, createdBy: userId, updatedBy: userId };
  }
}
