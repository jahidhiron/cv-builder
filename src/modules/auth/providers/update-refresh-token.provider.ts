import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class UpdateRefreshTokenProvider {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  async execute(
    where: FindOptionsWhere<RefreshToken>,
    data: Partial<RefreshToken>,
  ): Promise<void> {
    await this.refreshTokenRepo.updateMany(where, data);
  }
}
