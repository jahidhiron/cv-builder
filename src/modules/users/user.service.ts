import type { UserPayload } from '@/modules/auth/interfaces';
import { FindOneOptions } from '@/common/base';
import { UserListQueryDto } from '@/modules/users/dtos';
import { User } from '@/modules/users/entities';
import {
  CreateUserProvider,
  DeleteUserProvider,
  FindOneUserProvider,
  ListUsersProvider,
  RestoreUserProvider,
  ToggleUserStatusProvider,
  UpdateUserProvider,
  UploadAvatarProvider,
  UserExistProvider,
} from '@/modules/users/providers';
import { MulterFile } from '@/shared/storage';
import { Injectable } from '@nestjs/common';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';

/**
 * Facade service for the users domain (controller-facing layer).
 *
 * Delegates each operation to its dedicated provider. This is the primary entry
 * point for the `UserController`.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly findOneUserProvider: FindOneUserProvider,
    private readonly listUsersProvider: ListUsersProvider,
    private readonly createUserProvider: CreateUserProvider,
    private readonly updateUserProvider: UpdateUserProvider,
    private readonly deleteUserProvider: DeleteUserProvider,
    private readonly restoreUserProvider: RestoreUserProvider,
    private readonly toggleUserStatusProvider: ToggleUserStatusProvider,
    private readonly uploadAvatarProvider: UploadAvatarProvider,
    private readonly userExistProvider: UserExistProvider,
  ) {}

  async findOne<TThrow extends boolean = true>(
    where: FindOptionsWhere<User>,
    options?: FindOneOptions<User, TThrow>,
  ): Promise<TThrow extends false ? { user: User | null } : { user: User }> {
    const user = options?.throwError === false
      ? await this.findOneUserProvider.execute(where, { throwError: false })
      : await this.findOneUserProvider.execute(where);
    return { user } as never;
  }

  /** Return a paginated list of users. Excludes the current user via request context. */
  list(dto: UserListQueryDto) {
    return this.listUsersProvider.execute(dto);
  }

  /**
   * Lightweight existence check. Returns `true` when at least one user matches
   * the given conditions, `false` otherwise.
   */
  exists(where: FindOptionsWhere<User>): Promise<boolean> {
    return this.userExistProvider.execute(where);
  }

  /** Create a user from raw data. Used by auth flows (signup, Google OAuth). */
  create(data: DeepPartial<User>): Promise<User> {
    return this.createUserProvider.execute(data);
  }

  /** Update user fields by condition. Throws 404 when not found. */
  async update(where: FindOptionsWhere<User>, dto: DeepPartial<User>) {
    const user = await this.updateUserProvider.execute(where, dto);
    return { user };
  }

  /**
   * Delete a user by ID.
   * @param force - When `true`, permanently deletes the row; otherwise soft-deletes.
   */
  remove(id: number, currentUser: UserPayload, force = false) {
    return this.deleteUserProvider.execute({ id }, currentUser.id, force);
  }

  /** Restore a previously soft-deleted user. Throws 400 if not archived. */
  async restore(id: number) {
    const user = await this.restoreUserProvider.execute({ id });
    return { user };
  }

  /** Set `isActive = true` for the user. Throws 409 if already active. */
  async activate(id: number) {
    const user = await this.toggleUserStatusProvider.execute(id, true);
    return { user };
  }

  /** Set `isActive = false` for the user. Throws 409 if already inactive. */
  async deactivate(id: number) {
    const user = await this.toggleUserStatusProvider.execute(id, false);
    return { user };
  }

  /**
   * Upload a new avatar for the user.
   * Returns the updated user and the new avatar URL.
   */
  async uploadAvatar(id: number, file: MulterFile) {
    const result = await this.uploadAvatarProvider.execute(id, file);
    const { user } = await this.findOne({ id });
    return { user: { ...user, avatarUrl: result.avatarUrl } };
  }
}
