import { ModuleName } from '@/common/base/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { User } from '@/modules/users/entities/user.entity';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Activates or deactivates a user account.
 *
 * Throws 403 when the caller tries to change their own status (prevent self-lockout).
 * Throws 409 when the requested state is already the current state to prevent
 * no-op updates that could confuse calling clients.
 */
@Injectable({ scope: Scope.REQUEST })
export class ToggleUserStatusProvider {
  constructor(
    private readonly findOneUser: FindOneUserProvider,
    private readonly updateUser: UpdateUserProvider,
    private readonly errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {}

  async execute(id: number, isActive: boolean): Promise<User> {
    if (id === this.request.user?.id) {
      await this.errorResponse.forbidden({ module: ModuleName.User, key: 'self-deactivate' });
    }

    const user = await this.findOneUser.execute({ id });

    if (isActive && user.isActive) {
      await this.errorResponse.conflict({ module: ModuleName.User, key: 'user-already-active' });
    }

    if (!isActive && !user.isActive) {
      await this.errorResponse.conflict({ module: ModuleName.User, key: 'user-already-inactive' });
    }

    return await this.updateUser.execute({ id }, { isActive });
  }
}
