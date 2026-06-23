import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';

/**
 * Retrieves a single {@link ServerError} record by any `FindOptionsWhere<ServerError>` condition.
 *
 * Throws a 404 `HttpException` when no matching record exists.
 * Used by {@link ErrorTrackingService.findOne} for the admin detail endpoint.
 */
@Injectable()
export class FindOneServerErrorProvider extends BaseFindOneProvider<ServerError> {
  constructor(repo: ServerErrorRepository, errorResponse: ErrorResponse) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }
}
