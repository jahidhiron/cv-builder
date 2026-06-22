import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Creates and persists a new user.
 * Callers (signup, Google OAuth) are responsible for hashing passwords and
 * resolving the role before passing the payload.
 */
@Injectable()
export class CreateUserProvider extends BaseCreateProvider<User, DeepPartial<User>> {
  constructor(repo: UserRepository, errorResponse: ErrorResponse) {
    super(ModuleName.User, repo, errorResponse);
  }
}
