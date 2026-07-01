import { BaseRestoreProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { User } from '@/modules/users/entities/user.entity';
import { UserAction } from '@/modules/users/enums/user-action.enum';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Restores a previously soft-deleted {@link User} record.
 *
 * Extends {@link BaseRestoreProvider} which clears `deletedAt` and re-enables
 * the account. Throws 400 when the matched record is not currently
 * soft-deleted (idempotency guard). Throws 404 when no record matches `where`.
 *
 * The `execute` override exists solely to attach `@SystemLog` for
 * activity-log recording; all restore logic is handled by the base class.
 * `afterRestore` emits a `ProfileRestored` entry noting the actor and target.
 */
@Injectable({ scope: Scope.REQUEST })
export class RestoreUserProvider extends BaseRestoreProvider<User> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  /**
   * Post-restore hook — records the restoration in the activity log.
   *
   * @param entity - The restored user record.
   */
  protected override afterRestore(entity: User): Promise<void> {
    this.activityLog.logUser({
      action: UserAction.ProfileRestored,
      userId: this.request.user?.id,
      metadata: { targetUserId: Number(entity.id) },
    });
    return Promise.resolve();
  }
}
