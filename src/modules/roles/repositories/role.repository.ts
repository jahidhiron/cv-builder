import { BaseRepository } from '@/common/base/repositories/base.repository';
import { Role } from '@/modules/roles/entities/role.entity';
import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Persistence layer for the `role` table.
 * Inherits all standard CRUD and paginated-list operations from `BaseRepository`.
 * Case-insensitive uniqueness checks on `name` are performed in the provider layer
 * using `ILike` before delegating to this repository.
 */
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
