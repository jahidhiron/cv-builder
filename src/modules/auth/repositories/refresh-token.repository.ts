import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Persistence layer for the `refresh_token` table.
 *
 * Bulk revocation and stale-token cleanup are handled by
 * `RevokeRefreshTokenProvider` and `CleanupRefreshTokenProvider` respectively,
 * both via {@link BaseRepository.rawQuery}.
 */
@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, RefreshToken, 'refresh_token', errorResponse, logger);
  }
}
