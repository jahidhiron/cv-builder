import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import { UserRole } from '@/modules/auth/enums';
import { JwtPayload, UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { getDeviceFingerprint } from '@/modules/auth/utils';
import { RoleService } from '@/modules/roles/services';
import { User } from '@/modules/users/entities/user.entity';
import { UserService } from '@/modules/users/services';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { GoogleSigninDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class GoogleSigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
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
      return this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-google-token' });
    }

    let user = await this.userService.findByEmail(googlePayload.email);

    if (!user) {
      const role = await this.roleService.findByKey(UserRole.User);
      if (!role) {
        await this.errorResponse.notFound({ module: ModuleName.Role, key: 'role-not-found' });
      }
      user = await this.userService.create({
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
        await this.userService.update({ id: user.id }, { googleId: googlePayload.sub });
      }
    }

    const familyId = getDeviceFingerprint(this.request);
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
}
