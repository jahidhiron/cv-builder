import { ModuleName } from '@/common/base/enums';
import { BaseDeleteProvider } from '@/common/base';
import { UserPayload } from '@/modules/auth/interfaces';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Soft- or hard-deletes a user.
 * When `force = true`, the record is permanently removed from the database.
 */
@Injectable({ scope: Scope.REQUEST })
export class DeleteUserProvider extends BaseDeleteProvider<User> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  protected override async beforeDelete(entity: User): Promise<void> {
    if (entity.id === this.request.user?.id) {
      await this.errorResponse.forbidden({ module: ModuleName.User, key: 'self-delete' });
    }
  }
}
