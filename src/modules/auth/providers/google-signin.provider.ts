import { ModuleName } from '@/common/enums';
import { JwtPayload, UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { UserRole } from '@/modules/auth/enums';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ConfigService } from '@/config';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import type { Request } from 'express';
import { GoogleSigninDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class GoogleSigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly userRepo: UserRepository,
    private readonly roleRepo: RoleRepository,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly configService: ConfigService,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
  ) {}

  async execute(dto: GoogleSigninDto) {
    const client = new OAuth2Client(this.configService.google.clientId);

    let googlePayload: { sub: string; email: string; name: string; picture?: string };
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: this.configService.google.clientId,
      });
      const p = ticket.getPayload();
      if (!p?.sub || !p.email) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-google-token' });
      }
      googlePayload = { sub: p!.sub, email: p!.email!, name: p!.name ?? p!.email!, picture: p!.picture };
    } catch {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-google-token' });
      return; // unreachable — keeps TS happy
    }

    let user = await this.userRepo.findOne({ email: googlePayload.email });

    if (!user) {
      const role = await this.roleRepo.findOne({ key: UserRole.User });
      if (!role) {
        await this.errorResponse.notFound({ module: ModuleName.Role, key: 'role-not-found' });
      }
      user = await this.userRepo.create({
        name: googlePayload.name,
        email: googlePayload.email,
        googleId: googlePayload.sub,
        avatarUrl: googlePayload.picture ?? null,
        roleId: role!.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      } as Partial<User>);
    } else {
      if (user.isDeleted) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
      }
      if (!user.isActive) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });
      }
      if (!user.googleId) {
        await this.userRepo.update({ id: user.id }, { googleId: googlePayload.sub });
      }
    }

    const familyId = this.deviceFingerprint();
    const sessionId = this.hashService.generateToken(8);

    const jwtPayload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
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

    await this.createRefreshToken.execute(refreshToken, user.id);
    await this.cleanupRefreshToken.execute(user.id);

    await this.createAuthHistory.execute({
      userId: user.id,
      sessionId,
      familyId,
      loggedInAt: new Date(),
      expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000),
    });

    const userPayload: UserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
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
