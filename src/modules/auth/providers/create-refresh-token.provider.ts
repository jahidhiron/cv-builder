import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base/providers/base-create.provider';
import { getDeviceFingerprint } from '@/common/utils';
import { ConfigService } from '@/config';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';
import type { CreateRefreshTokenDto } from './interfaces';

/**
 * Hashes a raw refresh JWT and persists it as a `RefreshToken` record.
 *
 * The raw token is stored as an scrypt hash (not plaintext) so that a database
 * breach cannot be used to replay tokens. The `familyId` (device fingerprint)
 * enables device-scoped token revocation.
 */
@Injectable({ scope: Scope.REQUEST })
export class CreateRefreshTokenProvider extends BaseCreateProvider<
  RefreshToken,
  CreateRefreshTokenDto
> {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    repo: RefreshTokenRepository,
    errorResponse: ErrorResponse,
    private readonly hashService: HashService,
    private readonly configService: ConfigService,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  protected override async buildPayload(dto: CreateRefreshTokenDto): Promise<DeepPartial<RefreshToken>> {
    const tokenHash = await this.hashService.createHash(dto.token);
    const expiresAt = new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000);
    const familyId = getDeviceFingerprint(this.request);

    return {
      tokenHash,
      userId: dto.userId,
      expiresAt,
      familyId,
      sessionStartedAt: dto.sessionStartedAt ?? new Date(),
    } as DeepPartial<RefreshToken>;
  }
}
