import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Repository for the `server_errors` table.
 *
 * Thin extension of {@link BaseRepository} — all custom SQL lives in the
 * providers (e.g. the atomic upsert in {@link UpsertServerErrorProvider}).
 */
@Injectable()
export class ServerErrorRepository extends BaseRepository<ServerError> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, ServerError, 'server_error', errorResponse, logger);
  }
}
