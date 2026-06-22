import { ModuleName } from '@/common/base/enums';
import { BaseRestoreProvider } from '@/common/base';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Restores a previously soft-deleted user.
 * Throws 400 if the user record is not currently in a deleted state.
 */
@Injectable({ scope: Scope.REQUEST })
export class RestoreUserProvider extends BaseRestoreProvider<User> {
  constructor(repo: UserRepository, errorResponse: ErrorResponse) {
    super(ModuleName.User, repo, errorResponse);
  }
}
