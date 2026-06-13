import { BaseRepository } from '@/common/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { LoginHistory } from '@/modules/auth/entities/login-history.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
