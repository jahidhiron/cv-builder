import { ModuleName } from '@/common/base/enums';
import { BaseUpdateProvider } from '@/common/base/providers/base-update.provider';
import { SystemLog } from '@/modules/activity-log/decorators';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';

/**
 * Updates a refresh token record matching the given conditions.
 * Used to stamp `revokedAt` and `revokedReason` during logout and token rotation.
 */
@Injectable()
export class UpdateRefreshTokenProvider extends BaseUpdateProvider<RefreshToken, DeepPartial<RefreshToken>> {
  constructor(
    repo: RefreshTokenRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  @SystemLog(ModuleName.Auth)
  override async execute(
    where: FindOptionsWhere<RefreshToken>,
    dto: DeepPartial<RefreshToken>,
  ): Promise<RefreshToken> {
    return super.execute(where, dto);
  }
}