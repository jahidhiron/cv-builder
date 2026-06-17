import { ConfigService } from '@/config';
import { LogoutType } from '@/modules/auth/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { RedisService } from '@/shared/redis/redis.service';
import { Injectable, Scope } from '@nestjs/common';
import { LogoutQueryDto } from '../dtos';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable({ scope: Scope.REQUEST })
export class LogoutProvider {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly verifyRefreshToken: VerifyRefreshTokenProvider,
    private readonly updateRefreshToken: UpdateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async execute(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string): Promise<void> {
    if (dto.from === LogoutType.All) {
      const allKeys = await this.redisService.keys(`auth:${user.id}:*`);
      for (const key of allKeys) {
        await this.blacklistAndDelete(key);
      }
      await this.refreshTokenRepo.revokeMany({ userId: user.id }, 'signout-all');
      await this.createAuthHistory.execute(
        { userId: user.id, sessionId: user.sessionId!, loggedOutAt: new Date() },
        true,
      );
    } else {
      const redisKey = `auth:${user.id}:${user.familyId}:${user.sessionId}`;
      const tokens = await this.blacklistAndDelete(redisKey);
      const tokenToRevoke = tokens?.refreshToken ?? rawRefreshToken;
      if (tokenToRevoke) {
        const dbToken = await this.verifyRefreshToken.execute(tokenToRevoke, user.id);
        if (dbToken) {
          await this.updateRefreshToken.execute(
            { id: dbToken.id },
            { revokedAt: new Date(), revokedReason: 'signout' } as Partial<RefreshToken>,
          );
        }
      }
      await this.createAuthHistory.execute({
        userId: user.id,
        sessionId: user.sessionId!,
        loggedOutAt: new Date(),
      });
    }

    await this.cleanupRefreshToken.execute(user.id);
  }

  private async blacklistAndDelete(
    redisKey: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokens = await this.redisService.hgetall<{ accessToken: string; refreshToken: string }>(redisKey);
    if (tokens) {
      await Promise.all([
        tokens.accessToken &&
          this.redisService.set(
            `blacklist:${tokens.accessToken}`,
            '1',
            this.configService.jwt.accessTokenExpiredIn,
          ),
        tokens.refreshToken &&
          this.redisService.set(
            `blacklist:${tokens.refreshToken}`,
            '1',
            this.configService.jwt.refreshTokenExpiredIn,
          ),
        this.redisService.del(redisKey),
      ]);
    }
    return tokens;
  }
}
