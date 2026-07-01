import { BaseDeleteProvider } from '@/common/base';
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
 * Soft- or hard-deletes a {@link User} record.
 *
 * When `force = true` the row is permanently removed from the database;
 * otherwise `deletedAt` is stamped and the record is excluded from normal
 * queries (soft-delete). Throws 404 when no matching user is found.
 *
 * Extends {@link BaseDeleteProvider} with two lifecycle hooks:
 * - `beforeDelete` — blocks self-deletion with a 403 Forbidden.
 * - `afterDelete`  — emits a `ProfileDeleted` activity-log entry recording
 *   the actor, the target user, and whether the delete was forced.
 */
@Injectable({ scope: Scope.REQUEST })
export class DeleteUserProvider extends BaseDeleteProvider<User> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  /**
   * Pre-delete hook — prevents a user from deleting their own account.
   *
   * @param entity - The user record about to be deleted.
   * @throws {ForbiddenException} When `entity.id` matches the authenticated
   *         user's ID.
   */
  protected override async beforeDelete(entity: User): Promise<void> {
    if (entity.id === this.request.user?.id) {
      await this.errorResponse.forbidden({ module: ModuleName.User, key: 'self-delete' });
    }
  }

  /**
   * Post-delete hook — records the deletion in the activity log.
   *
   * @param entity - The deleted user record.
   * @param force  - `true` when the record was hard-deleted, `false` for
   *                 soft-delete.
   */
  protected override afterDelete(entity: User, force: boolean): Promise<void> {
    this.activityLog.logUser({
      action: UserAction.ProfileDeleted,
      userId: this.request.user?.id,
      metadata: { targetUserId: Number(entity.id), force },
    });
    return Promise.resolve();
  }
}
