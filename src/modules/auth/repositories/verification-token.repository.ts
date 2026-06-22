import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Persistence layer for the `verification_token` table.
 *
 * Stores one-time tokens for email verification and password reset flows.
 * Each token has a `type` discriminator (`email_verification` / `password_reset`)
 * and an `expiresAt` timestamp. Tokens are deleted on successful consumption by
 * `VerifyTokenProvider`.
 */
@Injectable()
export class VerificationTokenRepository extends BaseRepository<VerificationToken> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, VerificationToken, 'verification_token', errorResponse, logger);
  }

}
