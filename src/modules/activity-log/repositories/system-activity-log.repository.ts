import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SystemActivityLog } from '../entities';

/**
 * Repository for the `system_activity_logs` table.
 *
 * Records internal provider-level operations captured by the `@SystemLog`
 * decorator. Each row tracks the module, class, method name, execution status,
 * duration, input / output snapshots, and a FK to `request_logs` so the entry
 * can be correlated with the HTTP request that triggered it.
 *
 * Inherits all standard CRUD and paginated-list operations from
 * {@link BaseRepository}.
 */
@Injectable()
export class SystemActivityLogRepository extends BaseRepository<SystemActivityLog> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, SystemActivityLog, 'system_activity_log', errorResponse, logger);
  }
}
