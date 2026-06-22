import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { LoginHistory } from '@/modules/auth/entities/login-history.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Persistence layer for the `login_history` table.
 *
 * Records every sign-in and sign-out event for audit purposes.
 * Rows are written by `CreateAuthHistoryProvider` and are never updated —
 * each event produces a new immutable row with its own `action` discriminator.
 */
@Injectable()
export class LoginHistoryRepository extends BaseRepository<LoginHistory> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, LoginHistory, 'login_history', errorResponse, logger);
  }
}
