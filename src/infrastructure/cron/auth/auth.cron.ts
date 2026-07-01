import { AppLogger } from '@/config/logger';
import { PurgeExpiredTokensProvider } from '@/infrastructure/cron/auth/providers';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Scheduled job that runs once at midnight every day to hard-delete all
 * expired and revoked refresh tokens across all users.
 *
 * Active accounts are cleaned up incrementally at sign-in time by
 * {@link CleanupRefreshTokenProvider}. This job handles the remainder —
 * dormant accounts that accumulate stale rows without ever signing in.
 */
@Injectable()
export class PurgeExpiredTokensCronService {
  constructor(
    private readonly purgeExpiredTokens: PurgeExpiredTokensProvider,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Cron handler triggered at midnight every day to purge stale refresh tokens.
   *
   * @returns Promise that resolves when the purge has completed
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePurgeExpiredTokens(): Promise<void> {
    this.logger.log('Starting nightly refresh-token purge', PurgeExpiredTokensCronService.name);
    await this.purgeExpiredTokens.execute();
  }
}
