import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base/providers/base-create.provider';
import { clientIp } from '@/common/utils';
import { EXPIRED_AFTER_MINUTES } from '@/modules/auth/constants';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import type { TokenPayload } from '@/modules/auth/interfaces';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';
import { InvalidatePreviousTokenProvider } from './invalidate-previous-token.provider';

/**
 * Issues a new {@link VerificationToken} for a user.
 *
 * Extends {@link BaseCreateProvider} with two overrides:
 * - `beforeCreate` — invalidates any existing unapplied token of the same
 *   type, preventing token-farming via repeated forgot-password or
 *   resend-verification requests.
 * - `buildPayload` — assembles the full token record: a 64-character hex
 *   value, a {@link EXPIRED_AFTER_MINUTES 30-minute} expiry, the requester's
 *   IP address, and initial `applied: false` / `verified: false` flags.
 *
 */
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
   * Pre-create hook — voids all unapplied tokens of the same type for the
   * user before the new one is persisted.
   *
   * Marks matching rows `applied: true` rather than deleting them so the
   * audit trail remains intact. This prevents token farming from repeated
   * forgot-password or resend-verification calls.
   *
   * @param dto - The {@link TokenPayload} carrying the token type and user.
   * @returns Resolves with `void` once all prior tokens have been invalidated.
   */
  protected override async beforeCreate(dto: TokenPayload): Promise<void> {
    await this.invalidatePreviousToken.execute(
      { userId: dto.user.id, type: dto.type, applied: false },
      { applied: true },
    );
  }

  /**
   * Assembles the {@link VerificationToken} database payload from the
   * incoming {@link TokenPayload}.
   *
   * - **token** — 64-character hex string generated from 32 random bytes.
   * - **expiredAt** — `now + {@link EXPIRED_AFTER_MINUTES}` (30 minutes).
   * - **ip** — client IP extracted from the active request via
   *   {@link clientIp}, supporting `X-Forwarded-For` and direct connections.
   * - **applied / verified** — both initialised to `false`.
   *
   * @param dto - The {@link TokenPayload} carrying the token type and user.
   * @returns The fully assembled {@link VerificationToken} partial ready to
   *          be persisted by the base `create` call.
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
