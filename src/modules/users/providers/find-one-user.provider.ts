import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { User } from '@/modules/users/entities';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Retrieves a single user by any `FindOptionsWhere<User>` criteria.
 * Throws 404 when no matching user exists.
 */
@Injectable({ scope: Scope.REQUEST })
export class FindOneUserProvider extends BaseFindOneProvider<User> {
  constructor(repo: UserRepository, errorResponse: ErrorResponse) {
    super(ModuleName.User, repo, errorResponse);
  }
}
