import { UserPayload } from '@/modules/auth/interfaces';
import { UpdateUserDto, UserListQueryDto } from '@/modules/users/dtos';
import {
  DeleteUserProvider,
  FindOneUserProvider,
  ListUsersProvider,
  RestoreUserProvider,
  ToggleUserStatusProvider,
  UpdateUserProvider,
  UploadAvatarProvider,
} from '@/modules/users/providers';
import { MulterFile } from '@/shared/storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private readonly findOneUserProvider: FindOneUserProvider,
    private readonly listUsersProvider: ListUsersProvider,
    private readonly updateUserProvider: UpdateUserProvider,
    private readonly deleteUserProvider: DeleteUserProvider,
    private readonly restoreUserProvider: RestoreUserProvider,
    private readonly toggleUserStatusProvider: ToggleUserStatusProvider,
    private readonly uploadAvatarProvider: UploadAvatarProvider,
  ) {}

  async findOne(id: number) {
    const user = await this.findOneUserProvider.execute({ id });
    return { user };
  }

  list(dto: UserListQueryDto, currentUser: UserPayload) {
    return this.listUsersProvider.execute(dto, currentUser.id);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.updateUserProvider.execute({ id }, dto);
    return { user };
  }

  remove(id: number, currentUser: UserPayload, force = false) {
    return this.deleteUserProvider.execute(id, currentUser.id, force);
  }

  async restore(id: number) {
    const user = await this.restoreUserProvider.execute(id);
    return { user };
  }

  async activate(id: number) {
    const user = await this.toggleUserStatusProvider.execute(id, true);
    return { user };
  }

  async deactivate(id: number) {
    const user = await this.toggleUserStatusProvider.execute(id, false);
    return { user };
  }

  async uploadAvatar(id: number, file: MulterFile) {
    const result = await this.uploadAvatarProvider.execute(id, file);
    const user = await this.findOneUserProvider.execute({ id });
    return { user, avatarUrl: result.avatarUrl };
  }
}
