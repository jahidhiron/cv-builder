import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { UserPayload } from '@/modules/auth/interfaces';
import { UserAction } from '@/modules/users/enums/user-action.enum';
import { User } from '@/modules/users/entities/user.entity';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Activates or deactivates a {@link User} account.
 *
 * Guards against two unsafe operations before applying the change:
 * - **Self-lockout** — throws 403 when the authenticated user targets their
 *   own account, preventing accidental self-deactivation.
 * - **No-op conflict** — throws 409 when the requested `isActive` state
 *   already matches the current state, keeping client-side state consistent.
 *
 * On success the updated user is returned and a `StatusToggled` entry is
 * emitted to the activity log recording the actor, target, and new state.
 */
@Injectable({ scope: Scope.REQUEST })
export class ToggleUserStatusProvider {
  constructor(
    private readonly findOneUser: FindOneUserProvider,
    private readonly updateUser: UpdateUserProvider,
    private readonly errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Sets `isActive` on the user identified by `id`.
   *
   * @param id       - Primary key of the user to activate or deactivate.
   * @param isActive - `true` to activate, `false` to deactivate.
   * @returns The updated {@link User} entity.
   * @throws {ForbiddenException}  When `id` matches the authenticated user's
   *         own ID.
   * @throws {NotFoundException}   When no user with the given `id` exists.
   * @throws {ConflictException}   When the user's `isActive` state is already
   *         equal to the requested value.
   */
  @SystemLog(ModuleName.User)
  async execute(id: number, isActive: boolean): Promise<User> {
    if (id === this.request.user?.id) {
      await this.errorResponse.forbidden({ module: ModuleName.User, key: 'self-deactivate' });
    }

    const user = await this.findOneUser.execute({ id });

    if (isActive && user.isActive) {
      await this.errorResponse.conflict({ module: ModuleName.User, key: 'user-already-active' });
    }

    if (!isActive && !user.isActive) {
      await this.errorResponse.conflict({ module: ModuleName.User, key: 'user-already-inactive' });
    }

    const updated = await this.updateUser.execute({ id }, { isActive });
    this.activityLog.logUser({
      action: UserAction.StatusToggled,
      userId: this.request.user?.id,
      metadata: { targetUserId: id, isActive },
    });
    return updated;
  }
}
