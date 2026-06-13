import { LogoutType } from '@/modules/auth/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
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
  ) {}

  async execute(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string): Promise<void> {
    if (dto.from === LogoutType.All) {
      await this.refreshTokenRepo.revokeMany({ userId: user.id }, 'signout-all');
      await this.createAuthHistory.execute(
        { userId: user.id, sessionId: user.sessionId!, loggedOutAt: new Date() },
        true,
      );
    } else {
      if (rawRefreshToken) {
        const dbToken = await this.verifyRefreshToken.execute(rawRefreshToken, user.id);
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
}
