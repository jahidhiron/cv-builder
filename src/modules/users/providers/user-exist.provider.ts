import { User } from '@/modules/users/entities';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable, Scope } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Lightweight existence check for a `User` matching the given conditions.
 *
 * Delegates to {@link BaseRepository.exists}, which runs a single
 * `SELECT EXISTS(...)` against the database — cheaper than `findOne` when
 * the caller only needs a boolean answer and never the full row.
 *
 * @example
 * ```ts
 * const hasEmail = await this.userExist.execute({ email });
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class UserExistProvider {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * Returns `true` when at least one user matches `where`, `false` otherwise.
   *
   * @param where - TypeORM `FindOptionsWhere<User>` conditions.
   */
  async execute(where: FindOptionsWhere<User>): Promise<boolean> {
    return this.userRepo.exists(where);
  }
}
