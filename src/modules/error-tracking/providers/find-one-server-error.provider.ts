import type { FindOneOptions } from '@/common/base';
import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Retrieves a single {@link ServerError} record by any `FindOptionsWhere<ServerError>` condition.
 *
 * Throws a 404 `HttpException` when no matching record exists.
 * Used by {@link ErrorTrackingService.findOne} for the admin detail endpoint.
 */
@Injectable()
export class FindOneServerErrorProvider extends BaseFindOneProvider<ServerError> {
  constructor(
    repo: ServerErrorRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }

  /**
   * Finds a single server error matching the given criteria.
   *
   * @param where   - TypeORM filter applied to the `server_errors` table.
   * @param options - Optional query modifiers; set `throwError: false` to return
   *                  `null` instead of throwing when no record is found.
   * @returns The matching {@link ServerError} entity, or `null` when `throwError` is `false`
   *          and no record exists.
   * @throws {NotFoundException} When no matching record exists and `throwError` is not `false`.
   */
  @SystemLog(ModuleName.ErrorTracking)
  override async execute<TThrow extends boolean = true>(
    where: FindOptionsWhere<ServerError>,
    options?: FindOneOptions<ServerError, TThrow>,
  ): Promise<TThrow extends false ? ServerError | null : ServerError> {
    return this.findOne(where, options);
  }
}