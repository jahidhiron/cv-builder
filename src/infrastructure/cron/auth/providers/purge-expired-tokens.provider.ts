import { AppLogger } from '@/config/logger';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Hard-deletes stale refresh tokens from the database.
 *
 * A token is considered stale when either condition is true:
 *
 * - `revoked_at IS NOT NULL` — explicitly invalidated (logout, token rotation,
 *   or suspicious-activity detection). The row is retained only long enough for
 *   theft-detection comparisons; once here, it is permanently unusable.
 *
 * - `expires_at <= NOW()` — TTL has elapsed. Even a non-revoked token cannot be
 *   presented after its expiry, so the row has no operational value.
 *
 * Called once per day by {@link PurgeExpiredTokensCronService} to prevent
 * unbounded table growth for dormant accounts (active accounts are cleaned up
 * per-user during sign-in by {@link CleanupRefreshTokenProvider}).
 */
@Injectable()
export class PurgeExpiredTokensProvider {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
    private readonly logger: AppLogger,
  ) {}

  async execute(): Promise<void> {
    const deleted: { id: string }[] = await this.repo.query(
      `DELETE FROM refresh_tokens
       WHERE revoked_at IS NOT NULL
          OR expires_at <= $1
       RETURNING id`,
      [new Date()],
    );

    this.logger.log(
      `Purged ${deleted.length} expired/revoked refresh tokens`,
      PurgeExpiredTokensProvider.name,
    );
  }
}
