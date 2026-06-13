import { BaseRepository } from '@/common/repositories/base.repository';
import { Role } from '@/modules/roles/entities/role.entity';
import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RoleRepository extends BaseRepository<Role> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, Role, 'role', errorResponse, logger);
  }
}
