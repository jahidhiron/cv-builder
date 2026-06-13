import { EXPIRED_AFTER_MINUTES } from '@/modules/auth/constants/auth.constant';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { TokenPayload } from '@/modules/auth/interfaces';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { HashService } from '@/shared/hash/hash.service';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CreateTokenProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly verificationTokenRepo: VerificationTokenRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(payload: TokenPayload): Promise<{ data: VerificationToken }> {
    const ip = (this.request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? this.request.socket?.remoteAddress
      ?? null;

    const expiredAt = new Date(Date.now() + EXPIRED_AFTER_MINUTES * 60 * 1000);
    const token = this.hashService.generateToken(32);

    const newToken = await this.verificationTokenRepo.create({
      token,
      type: payload.type,
      userId: payload.user.id,
      ip,
      expiredAt,
      applied: false,
      verified: false,
    } as Partial<VerificationToken>);

    return { data: newToken };
  }
}
