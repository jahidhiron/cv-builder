import { BasePaginatedListProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import type { PaginatedListParams } from '@/common/base/repositories/interfaces';
import { ServerErrorListQueryDto } from '@/modules/error-tracking/dtos';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';

/**
 * Returns a paginated list of {@link ServerError} records for administrator review.
 *
 * Free-text search runs across `errorName`, `message`, and `path`.
 * An optional `status` filter narrows results to a specific lifecycle state.
 */
@Injectable()
export class ListServerErrorsProvider extends BasePaginatedListProvider<
  ServerError,
  ServerErrorListQueryDto
> {
  constructor(repo: ServerErrorRepository, errorResponse: ErrorResponse) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }

  protected override buildParams(dto: ServerErrorListQueryDto): PaginatedListParams<ServerError> {
    return {
      ...super.buildParams(dto),
      searchBy: ['errorName', 'message', 'path'],
      ...(dto.status !== undefined && { query: { status: dto.status } }),
    };
  }
}
