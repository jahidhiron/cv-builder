import { ModuleName } from '@/common/base/enums';
import { BaseUpdateManyProvider } from '@/common/base/providers/base-update-many.provider';
import { LoginHistory } from '@/modules/auth/entities/login-history.entity';
import { LoginHistoryRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Extends `expiredAt` on login history rows when a refresh token is rotated,
 * keeping session expiry aligned with the new token lifetime.
 */
@Injectable()
export class UpdateLoginHistoryExpiryProvider extends BaseUpdateManyProvider<
  LoginHistory,
  DeepPartial<LoginHistory>
> {
  constructor(repo: LoginHistoryRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Auth, repo, errorResponse);
  }
}
