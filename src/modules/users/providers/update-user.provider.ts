import { ModuleName } from '@/common/base/enums';
import { BaseUpdateProvider } from '@/common/base';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Updates a user by a `where` condition.
 * Throws 404 when the user is not found and rejects soft-deleted records.
 * Used by both the users admin domain and the auth domain (password, email-verified, etc.).
 */
@Injectable()
export class UpdateUserProvider extends BaseUpdateProvider<User, DeepPartial<User>> {
  constructor(repo: UserRepository, errorResponse: ErrorResponse) {
    super(ModuleName.User, repo, errorResponse);
  }

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
}
