import { ConfigService } from '@/config';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { getDeviceFingerprint } from '@/modules/auth/utils';
import { HashService } from '@/shared/hash/hash.service';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CreateRefreshTokenProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly hashService: HashService,
    private readonly configService: ConfigService,
  ) {}

  async execute(token: string, userId: number): Promise<RefreshToken> {
    const tokenHash = await this.hashService.createHash(token);
    const expiresAt = new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000);
    const familyId = getDeviceFingerprint(this.request);

    return this.refreshTokenRepo.create({
      tokenHash,
      userId,
      expiresAt,
      familyId,
    } as Partial<RefreshToken>);
  }
}
