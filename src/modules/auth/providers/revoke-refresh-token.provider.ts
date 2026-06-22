import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import type { RevokeRefreshTokenPayload } from '@/modules/auth/providers/interfaces';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { Injectable } from '@nestjs/common';

/**
 * Bulk-revokes refresh tokens matching the given criteria.
 *
 * Centralises all revocation calls so that sign-in, logout, and token-theft
 * detection all go through one place rather than calling the repository directly.
 */
@Injectable()
export class RevokeRefreshTokenProvider {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  /**
   * @param where          - At least one of `userId` or `familyId` must be provided.
   * @param payload.reason - Human-readable reason stored on every revoked row.
   */
  async execute(
    where: Partial<Pick<RefreshToken, 'userId' | 'familyId'>>,
    { reason }: RevokeRefreshTokenPayload,
  ): Promise<void> {
    const params: unknown[] = [new Date(), reason];
    const conditions: string[] = ['revoked_at IS NULL'];

    if (where.userId) {
      params.push(where.userId);
      conditions.push(`user_id = $${params.length}`);
    }
    if (where.familyId) {
      params.push(where.familyId);
      conditions.push(`family_id = $${params.length}`);
    }

    await this.refreshTokenRepo.rawQuery(
      `UPDATE refresh_tokens SET revoked_at = $1, revoked_reason = $2 WHERE ${conditions.join(' AND ')}`,
      params,
    );
  }
}
