import { BaseUpdateProvider } from '@/common/base';
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
import type { DeepPartial } from 'typeorm';

/**
 * Updates a server-error record matched by any `FindOptionsWhere<ServerError>` condition.
 *
 * Serves two distinct callers:
 * - **System stamp** — {@link TrackErrorProvider} sets `emailSentAt` after the
 *   first-occurrence admin alert is sent. No activity is logged for this path.
 * - **Admin status transition** — {@link ErrorTrackingService.updateStatus} sets
 *   `status`. An `ErrorStatusUpdated` entry is logged against the authenticated
 *   admin resolved from the current request.
 */
@Injectable({ scope: Scope.REQUEST })
export class UpdateErrorTrackingProvider extends BaseUpdateProvider<ServerError, DeepPartial<ServerError>> {
  constructor(
    repo: ServerErrorRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }

  /**
   * Post-update hook — records an `ErrorStatusUpdated` activity log entry when
   * the applied payload includes a `status` transition. No-ops for the
   * automated `emailSentAt` stamp, which never carries a `status` field.
   *
   * @param entity - The updated server-error record.
   * @param dto    - The partial update payload that was applied.
   */
  protected override afterUpdate(entity: ServerError, dto: DeepPartial<ServerError>): Promise<void> {
    if (dto.status !== undefined) {
      this.activityLog.logUser({
        action: ErrorTrackingAction.ErrorStatusUpdated,
        userId: this.request.user?.id ?? null,
        metadata: { errorId: entity.id, status: dto.status },
      });
    }
    return Promise.resolve();
  }
}
