import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CleanupRefreshTokenProvider {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  async execute(userId: number): Promise<void> {
    await this.refreshTokenRepo.deleteStale(userId, new Date());
  }
}
