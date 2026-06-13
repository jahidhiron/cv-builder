import { BaseRepository } from '@/common/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
