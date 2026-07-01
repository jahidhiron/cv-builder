import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RequestLog } from '../entities/request-log.entity';

/**
 * Repository for the `request_logs` table.
 *
 * Stores one row per HTTP request containing metadata such as method, endpoint,
 * IP address, request body snapshot, and the final status code / duration.
 * All system and user activity log rows carry a FK to this table so every log
 * entry can be traced back to the originating request.
 *
 * Inherits all standard CRUD and paginated-list operations from
 * {@link BaseRepository}.
 */
@Injectable()
export class RequestLogRepository extends BaseRepository<RequestLog> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, RequestLog, 'request_log', errorResponse, logger);
  }
}
