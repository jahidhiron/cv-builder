import { BaseExistProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { User } from '@/modules/users/entities';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Lightweight existence check for a {@link User} matching the given conditions.
 *
 * Delegates to {@link BaseExistProvider#execute}, which issues a single
 * `SELECT EXISTS(...)` query — cheaper than `findOne` when the caller only
 * needs a boolean answer and never the full row.
 */
@Injectable({ scope: Scope.REQUEST })
export class UserExistProvider extends BaseExistProvider<User> {
  constructor(repo: UserRepository, errorResponse: ErrorResponse) {
    super(ModuleName.User, repo, errorResponse);
  }
}
