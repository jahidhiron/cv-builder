import { ModuleName } from '@/common/enums';
import {
  ACCOUNT_LOCKED_IN_MINUTES,
  MAX_LOGIN_FAILED_ATTEMPTS,
} from '@/modules/auth/constants/auth.constant';
import { JwtPayload, UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { ConfigService } from '@/config';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { SigninDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class SigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly userRepo: UserRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly errorResponse: ErrorResponse,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
  ) {}

  async execute(dto: SigninDto) {
    const user = await this.userRepo.findByEmailWithPassword(dto.email);

    if (!user) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-credentials' });
    }
    if (user!.isDeleted) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
    }
    if (!user!.isActive) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });
    }
    if (!user!.emailVerified) {
      await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'user-not-verified' });
    }
    if (user!.lockedUntil && user!.lockedUntil > new Date()) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'account-locked' });
    }
    if (!user!.password) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-credentials' });
    }

    const isMatch = await this.hashService.verify(user!.password!, dto.password);
    if (!isMatch) {
      user!.failedAttempts += 1;
      if (user!.failedAttempts >= MAX_LOGIN_FAILED_ATTEMPTS) {
        user!.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKED_IN_MINUTES * 60_000);
      }
      await this.userRepo.update(
        { id: user!.id },
        { failedAttempts: user!.failedAttempts, lockedUntil: user!.lockedUntil },
      );
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-credentials' });
    }

    await this.userRepo.update({ id: user!.id }, { failedAttempts: 0, lockedUntil: null });

    const familyId = this.deviceFingerprint();
    const sessionId = this.hashService.generateToken(8);

    await this.refreshTokenRepo.revokeMany({ userId: user!.id, familyId }, 'signin-replaced');

    const jwtPayload: JwtPayload = {
      sub: user!.id,
      name: user!.name,
      email: user!.email,
      roleId: user!.roleId,
      familyId,
      sessionId,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.jwt.accessSecret,
      expiresIn: this.configService.jwt.accessTokenExpiredIn,
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.jwt.refreshSecret,
      expiresIn: this.configService.jwt.refreshTokenExpiredIn,
    });

    await this.createRefreshToken.execute(refreshToken, user!.id);
    await this.cleanupRefreshToken.execute(user!.id);

    await this.createAuthHistory.execute({
      userId: user!.id,
      sessionId,
      familyId,
      loggedInAt: new Date(),
      expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000),
    });

    const userPayload: UserPayload = {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      roleId: user!.roleId,
      familyId,
      sessionId,
    };

    return { user: userPayload, token: { accessToken, refreshToken } };
  }

  private deviceFingerprint(): string {
    const ip = (this.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? this.request.socket?.remoteAddress ?? '';
    const ua = this.request.headers['user-agent'] ?? '';
    return Buffer.from(`${ip}|${ua}`).toString('base64').slice(0, 64);
  }
}
