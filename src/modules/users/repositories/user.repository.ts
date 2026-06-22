import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { User } from '@/modules/users/entities/user.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, User, 'user', errorResponse, logger);
  }
}
