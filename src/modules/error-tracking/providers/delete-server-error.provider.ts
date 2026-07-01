import { BaseDeleteProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import type { UserPayload } from '@/modules/auth/interfaces';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ErrorTrackingAction } from '@/modules/error-tracking/enums/error-tracking-action.enum';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Hard-deletes a {@link ServerError} record by ID.
 *
 * The `ServerError` entity has no soft-delete fields, so callers must always
 * pass `force = true`. Throws a 404 `HttpException` when the record does not exist.
 *
 * Extends {@link BaseDeleteProvider} with an `afterDelete` hook that emits an
 * `ErrorDeleted` activity-log entry recording the actor and the deleted record.
 */
@Injectable({ scope: Scope.REQUEST })
export class DeleteServerErrorProvider extends BaseDeleteProvider<ServerError> {
  constructor(
    repo: ServerErrorRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }

  /**
   * Post-delete hook — records the deletion in the activity log.
   *
   * @param entity - The deleted server-error record.
   * @param force  - `true` when the record was hard-deleted.
   */
  protected override afterDelete(entity: ServerError, force: boolean): Promise<void> {
    this.activityLog.logUser({
      action: ErrorTrackingAction.ErrorDeleted,
      userId: this.request.user?.id,
      metadata: { errorId: entity.id, force },
    });
    return Promise.resolve();
  }
}
