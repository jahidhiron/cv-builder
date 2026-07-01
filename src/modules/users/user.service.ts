import { FindOneOptions } from '@/common/base';
import type { UserPayload } from '@/modules/auth/interfaces';
import { CreateUserDto, UserListQueryDto } from '@/modules/users/dtos';
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

  /**
   * @param where   - TypeORM filter conditions.
   * @param options - Optional query options; set `throwError: false` to return
   *                  `{ user: null }` instead of throwing when no match is found.
   * @returns `{ user }` — the matched user, or `{ user: null }` when `throwError` is `false`.
   * @throws {NotFoundException} When no match is found and `throwError` is not `false`.
   */
  async findOne<TThrow extends boolean = true>(
    where: FindOptionsWhere<User>,
    options?: FindOneOptions<User, TThrow>,
  ): Promise<TThrow extends false ? { user: User | null } : { user: User }> {
    const user =
      options?.throwError === false
        ? await this.findOneUserProvider.execute(where, { throwError: false })
        : await this.findOneUserProvider.execute(where);
    return { user } as never;
  }

  /**
   * @param dto - Validated query parameters (page, limit, search term, etc.).
   * @returns `{ items, meta }` — paginated users, excluding the caller.
   */
  list(dto: UserListQueryDto) {
    return this.listUsersProvider.execute(dto);
  }

  /**
   * Lightweight existence check.
   *
   * @param where - TypeORM filter conditions.
   * @returns `{ exists: true }` when at least one user matches, `{ exists: false }` otherwise.
   */
  async exists(where: FindOptionsWhere<User>): Promise<{ exists: boolean }> {
    const exists = await this.userExistProvider.execute(where);
    return { exists };
  }

  /**
   * @param data - Partial user data to persist.
   * @returns `{ user }` — the newly created user.
   */
  async create(data: DeepPartial<User>): Promise<{ user: User }> {
    const user = await this.createUserProvider.execute(data);
    return { user };
  }

  /**
   * Creates a new user account on behalf of a super-admin.
   *
   * @param dto - Validated admin create payload.
   * @returns `{ user }` — the newly created user record.
   * @throws {ConflictException} When `dto.email` is already registered.
   * @throws {NotFoundException} When `dto.roleId` does not match any role.
   */
  async createUser(dto: CreateUserDto): Promise<{ user: User }> {
    const { user } = await this.createUserProvider.create(dto);
    return { user };
  }

  /**
   * @param where - TypeORM filter conditions identifying the user to update.
   * @param dto   - Fields to update.
   * @returns `{ user }` — the updated user.
   * @throws {NotFoundException} When no user matches `where`.
   */
  async update(where: FindOptionsWhere<User>, dto: DeepPartial<User>) {
    const user = await this.updateUserProvider.execute(where, dto);
    return { user };
  }

  /**
   * @param id          - User ID to delete.
   * @param currentUser - JWT payload of the actor (used for self-deletion guard).
   * @param force       - When `true`, permanently deletes the row; otherwise soft-deletes.
   * @returns Resolves when the deletion completes.
   * @throws {ForbiddenException} When the actor attempts to delete their own account.
   * @throws {NotFoundException} When no user with `id` exists.
   */
  remove(id: number, currentUser: UserPayload, force = false) {
    return this.deleteUserProvider.execute({ id }, currentUser.id, force);
  }

  /**
   * @param id - User ID to restore.
   * @returns `{ user }` — the restored user record.
   * @throws {NotFoundException}  When no user with `id` exists.
   * @throws {BadRequestException} When the matched record is not currently soft-deleted.
   */
  async restore(id: number) {
    const user = await this.restoreUserProvider.execute({ id });
    return { user };
  }

  /**
   * @param id - User ID to activate.
   * @returns `{ user }` — the updated user record with `isActive = true`.
   * @throws {NotFoundException}  When no user with `id` exists.
   * @throws {ConflictException}  When the user is already active.
   */
  async activate(id: number) {
    const user = await this.toggleUserStatusProvider.execute(id, true);
    return { user };
  }

  /**
   * @param id - User ID to deactivate.
   * @returns `{ user }` — the updated user record with `isActive = false`.
   * @throws {NotFoundException}  When no user with `id` exists.
   * @throws {ConflictException}  When the user is already inactive.
   */
  async deactivate(id: number) {
    const user = await this.toggleUserStatusProvider.execute(id, false);
    return { user };
  }

  /**
   * @param id   - User ID whose avatar to replace.
   * @param file - Validated multipart file (image; size/type checked by `AvatarFilePipe`).
   * @returns `{ user }` — the updated user record including the new `avatarUrl`.
   * @throws {NotFoundException} When no user with `id` exists.
   */
  async uploadAvatar(id: number, file: MulterFile) {
    const result = await this.uploadAvatarProvider.execute(id, file);
    const { user } = await this.findOne({ id });
    return { user: { ...user, avatarUrl: result.avatarUrl } };
  }
}
