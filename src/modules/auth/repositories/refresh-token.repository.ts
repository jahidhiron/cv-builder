import { BaseRepository } from '@/common/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, RefreshToken, 'refresh_token', errorResponse, logger);
  }

  async findActiveByUserId(userId: number): Promise<RefreshToken[]> {
    return this.repo.find({ where: { userId, revokedAt: IsNull() } });
  }

  async deleteStale(userId: number, before: Date): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .andWhere('(revoked_at IS NOT NULL OR expires_at <= :before)', { before })
      .execute();
  }

  async revokeMany(
    where: Partial<Pick<RefreshToken, 'userId' | 'familyId'>>,
    reason: string,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date(), revokedReason: reason })
      .where('revoked_at IS NULL');

    if (where.userId) qb.andWhere('user_id = :userId', { userId: where.userId });
    if (where.familyId) qb.andWhere('family_id = :familyId', { familyId: where.familyId });

    await qb.execute();
  }
}
