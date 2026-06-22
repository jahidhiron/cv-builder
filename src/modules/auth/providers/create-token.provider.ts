import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base/providers/base-create.provider';
import { clientIp } from '@/common/utils';
import { EXPIRED_AFTER_MINUTES } from '@/modules/auth/constants/auth.constant';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { TokenPayload } from '@/modules/auth/interfaces';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';
import { InvalidatePreviousTokenProvider } from './invalidate-previous-token.provider';

@Injectable({ scope: Scope.REQUEST })
export class CreateTokenProvider extends BaseCreateProvider<VerificationToken, TokenPayload> {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    repo: VerificationTokenRepository,
    errorResponse: ErrorResponse,
    private readonly hashService: HashService,
    private readonly invalidatePreviousToken: InvalidatePreviousTokenProvider,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  /**
   * Voids any existing unapplied tokens of the same type for the user before
   * the new token is persisted, preventing token farming from repeated
   * forgot-password / resend-verification calls.
   */
  protected override async beforeCreate(dto: TokenPayload): Promise<void> {
    await this.invalidatePreviousToken.execute(
      { userId: dto.user.id, type: dto.type, applied: false },
      { applied: true },
    );
  }

  /**
   * Generates a 64-character hex token, computes the expiry timestamp, and
   * resolves the requester's IP via the active request object.
   *
   * @param dto - Token type and the user the token belongs to.
   * @returns The `VerificationToken` payload ready to persist.
   */
  protected override buildPayload(dto: TokenPayload): DeepPartial<VerificationToken> {
    const expiredAt = new Date(Date.now() + EXPIRED_AFTER_MINUTES * 60 * 1000);
    const token = this.hashService.generateToken(32);
    return {
      token,
      type: dto.type,
      userId: dto.user.id,
      ip: clientIp(this.request),
      expiredAt,
      applied: false,
      verified: false,
    } as DeepPartial<VerificationToken>;
  }
}