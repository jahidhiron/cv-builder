import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
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
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  /**
   * Revokes all active refresh tokens matching `where` by stamping `revoked_at`
   * and recording a human-readable reason on every affected row.
   *
   * At least one of `where.userId` or `where.familyId` must be provided;
   * omitting both would silently update the entire table.
   *
   * @param where           - Filter criteria; supply `userId`, `familyId`, or both.
   * @param options         - Revocation metadata.
   * @param options.reason  - Human-readable reason stored on every revoked row.
   * @returns               Resolves when the bulk UPDATE completes.
   */
  @SystemLog(ModuleName.Auth)
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
