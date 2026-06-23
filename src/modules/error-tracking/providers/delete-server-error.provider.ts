import { BaseDeleteProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';

/**
 * Hard-deletes a {@link ServerError} record by ID.
 *
 * The `ServerError` entity has no soft-delete fields, so callers must always
 * pass `force = true`. Throws a 404 `HttpException` when the record does not exist.
 */
@Injectable()
export class DeleteServerErrorProvider extends BaseDeleteProvider<ServerError> {
  constructor(repo: ServerErrorRepository, errorResponse: ErrorResponse) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }
}
