import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import { AuthTokenResponse, JwtPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { LoginHistoryRepository } from '@/modules/auth/repositories';
import { UserService } from '@/modules/users/services';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable({ scope: Scope.REQUEST })
export class RefreshTokenProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly errorResponse: ErrorResponse,
    private readonly configService: ConfigService,
    private readonly verifyRefreshToken: VerifyRefreshTokenProvider,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly updateRefreshToken: UpdateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly loginHistoryRepo: LoginHistoryRepository,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokenResponse> {
    if (!refreshToken) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-refresh-token' });
    }

    let payload: JwtPayload | null = null;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.jwt.refreshSecret,
      });
    } catch (err: unknown) {
      const error = err as { name?: string };
      payload = this.jwtService.decode<JwtPayload>(refreshToken);
      if (payload?.sub && payload.sessionId) {
        await this.createAuthHistory.execute({
          userId: payload.sub,
          sessionId: payload.sessionId,
          loggedOutAt: new Date(),
        });
      }
      if (error.name === 'TokenExpiredError') {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'expired-refresh-token' });
      }
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-refresh-token' });
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) await this.errorResponse.unauthorized({ module: ModuleName.User, key: 'user-not-found' });
    if (user!.isDeleted) await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
    if (!user!.isActive) await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });

    const dbToken = await this.verifyRefreshToken.execute(refreshToken, payload.sub);
    if (!dbToken) await this.errorResponse.unauthorized();
    if (dbToken!.expiresAt.getTime() <= Date.now()) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'expired-refresh-token' });
    }

    await this.updateRefreshToken.execute(
      { id: dbToken!.id },
      { revokedAt: new Date(), revokedReason: 'refresh-replaced' } as Partial<RefreshToken>,
    );

    const newPayload: JwtPayload = {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      roleId: payload.roleId,
      familyId: dbToken!.familyId ?? payload.familyId,
      sessionId: payload.sessionId,
    };

    const accessToken = this.jwtService.sign(newPayload, {
      secret: this.configService.jwt.accessSecret,
      expiresIn: this.configService.jwt.accessTokenExpiredIn,
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      secret: this.configService.jwt.refreshSecret,
      expiresIn: this.configService.jwt.refreshTokenExpiredIn,
    });

    await this.createRefreshToken.execute(newRefreshToken, payload.sub);
    await this.cleanupRefreshToken.execute(payload.sub);

    await this.loginHistoryRepo.updateMany(
      { userId: payload.sub, sessionId: payload.sessionId },
      { expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000) },
    );

    return { token: { accessToken, refreshToken: newRefreshToken } };
  }
}
