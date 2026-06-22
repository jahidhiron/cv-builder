import type { CleanupRefreshTokenParams } from '@/modules/auth/providers/interfaces';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { Injectable } from '@nestjs/common';

/**
 * Deletes expired and revoked refresh tokens for a given user.
 *
 * Called after every sign-in, token rotation, and logout to keep the
 * `refresh_tokens` table lean. Safe to call redundantly.
 */
@Injectable()
export class CleanupRefreshTokenProvider {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  /**
   * @param params.userId - ID of the user whose stale tokens should be deleted.
   */
  async execute({ userId }: CleanupRefreshTokenParams): Promise<void> {
    await this.refreshTokenRepo.rawQuery(
      `DELETE FROM refresh_tokens
       WHERE user_id = $1
         AND (revoked_at IS NOT NULL OR expires_at <= $2)`,
      [userId, new Date()],
    );
  }
}
