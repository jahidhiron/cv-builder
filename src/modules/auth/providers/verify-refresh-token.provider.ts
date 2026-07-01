import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import type { VerifyRefreshTokenParams } from '@/modules/auth/providers/interfaces';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { HashService } from '@/shared/hash/hash.service';
import { Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

/**
 * Finds the database record that matches a given raw refresh token.
 *
 * Loads all non-revoked tokens for the user and checks each hash with
 * `HashService.verify` until a match is found. Returns `null` when no
 * matching record exists, allowing callers to treat an absent token as
 * unauthorised without a 404 boundary condition.
 */
@Injectable()
export class VerifyRefreshTokenProvider {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly hashService: HashService,
  ) {}

  /**
   * @param params.token  - The raw refresh JWT string.
   * @param params.userId - Owner of the token (used to scope the lookup).
   * @returns The matching `RefreshToken` record, or `null` if not found.
   */
  @SystemLog(ModuleName.Auth)
  async execute({ token, userId }: VerifyRefreshTokenParams): Promise<RefreshToken | null> {
    const tokens = await this.refreshTokenRepo.findMany({ userId, revokedAt: IsNull() });

    for (const dbToken of tokens) {
      if (!dbToken.tokenHash) continue;
      const isValid = await this.hashService.verify(dbToken.tokenHash, token);
      if (isValid) return dbToken;
    }

    return null;
  }
}
