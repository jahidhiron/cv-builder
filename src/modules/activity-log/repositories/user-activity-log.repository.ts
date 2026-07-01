import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserActivityLog } from '../entities';

/**
 * Repository for the `user_activity_logs` table.
 *
 * Records user-facing actions (e.g. login, profile update, document export)
 * explicitly logged via `ActivityLogService.logUser()`. Each row stores the
 * action label, user id, status, optional metadata, and a FK to `request_logs`
 * so the entry can be correlated with the originating HTTP request.
 *
 * Inherits all standard CRUD and paginated-list operations from
 * {@link BaseRepository}.
 */
@Injectable()
export class UserActivityLogRepository extends BaseRepository<UserActivityLog> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, UserActivityLog, 'user_activity_log', errorResponse, logger);
  }
}
