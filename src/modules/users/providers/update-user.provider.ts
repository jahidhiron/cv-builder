import { BaseUpdateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserAction } from '@/modules/users/enums';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Updates a {@link User} record matched by a `where` condition.
 *
 * Extends {@link BaseUpdateProvider} with an email-uniqueness guard: when the
 * incoming DTO changes the email address, `beforeUpdate` checks whether the
 * new value is already taken by another account and throws 409 if so.
 *
 * Throws 404 when no user matches `where` or the matched record is
 * soft-deleted. Used across multiple domains:
 * - **Users admin** — profile edits, status changes, avatar updates.
 * - **Auth** — `emailVerified` flag, password resets, remember-me tokens.
 *
 */
@Injectable()
export class UpdateUserProvider extends BaseUpdateProvider<User, DeepPartial<User>> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  /**
   * Pre-update hook — enforces email uniqueness when the DTO changes the
   * email address.
   *
   * No-ops when `dto.email` is absent or unchanged. Throws 409 when
   * another user record already owns the requested email.
   *
   * @param entity - The current user record fetched from the database.
   * @param dto    - The partial update payload supplied by the caller.
   * @throws {ConflictException} When `dto.email` is already registered to a
   *         different account.
   */
  protected override async beforeUpdate(entity: User, dto: DeepPartial<User>): Promise<void> {
    if (!dto.email || dto.email === entity.email) return;
    const existing = await this.repo.findOne({ email: dto.email });
    if (existing) {
      await this.errorResponse.conflict({
        module: ModuleName.User,
        key: 'email-taken',
      });
    }
  }

  /**
   * Post-update hook — records a `ProfileUpdated` activity log entry.
   *
   * @param entity - The updated user record.
   * @returns Resolves immediately after the log is queued.
   */
  protected override afterUpdate(entity: User): Promise<void> {
    this.activityLog.logUser({
      action: UserAction.ProfileUpdated,
      userId: entity.id,
    });
    return Promise.resolve();
  }
}
