import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { PasswordHistory } from '@/modules/auth/entities/password-history.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PasswordHistoryRepository extends BaseRepository<PasswordHistory> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, PasswordHistory, 'password_history', errorResponse, logger);
  }

}
