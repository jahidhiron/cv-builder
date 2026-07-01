import type { FindOneOptions } from '@/common/base';
import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { User } from '@/modules/users/entities';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Retrieves a single user by any `FindOptionsWhere<User>` criteria.
 * Throws 404 when no matching user exists.
 *
 * System logging is provided by the `@SystemLog` decorator which resolves
 * `ActivityLogService` via the module-level registry — no constructor
 * injection is required.
 */
@Injectable({ scope: Scope.REQUEST })
export class FindOneUserProvider extends BaseFindOneProvider<User> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  /**
   * Finds a single user matching the given criteria.
   *
   * @param where   - TypeORM filter applied to the `users` table.
   * @param options - Optional query modifiers; set `throwError: false` to return
   *                  `null` instead of throwing when no user is found.
   * @returns The matching {@link User} entity, or `null` when `throwError` is `false`
   *          and no record exists.
   * @throws {NotFoundException} When no matching user exists and `throwError` is not `false`.
   */
  @SystemLog(ModuleName.User)
  override async execute<TThrow extends boolean = true>(
    where: FindOptionsWhere<User>,
    options?: FindOneOptions<User, TThrow>,
  ): Promise<TThrow extends false ? User | null : User> {
    return this.findOne(where, options);
  }
}
