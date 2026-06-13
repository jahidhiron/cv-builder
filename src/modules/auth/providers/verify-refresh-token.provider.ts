import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { HashService } from '@/shared/hash/hash.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VerifyRefreshTokenProvider {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(token: string, userId: number): Promise<RefreshToken | null> {
    const tokens = await this.refreshTokenRepo.findActiveByUserId(userId);

    for (const dbToken of tokens) {
      if (!dbToken.tokenHash) continue;
      const isValid = await this.hashService.verify(dbToken.tokenHash, token);
      if (isValid) return dbToken;
    }

    return null;
  }
}
