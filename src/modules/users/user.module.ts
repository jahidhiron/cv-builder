import { ConfigModule } from '@/config';
import {
  CreateUserProvider,
  DeleteUserProvider,
  FindOneUserProvider,
  ListUsersProvider,
  RestoreUserProvider,
  ToggleUserStatusProvider,
  UpdateUserProvider,
  UploadAvatarProvider,
} from '@/modules/users/providers';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { UserService } from '@/modules/users/user.service';
import { UserController } from '@/modules/users/user.controller';
import { R2StorageModule } from '@/shared/storage';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, R2StorageModule],
  controllers: [UserController],
  providers: [
    UserRepository,
    FindOneUserProvider,
    CreateUserProvider,
    UpdateUserProvider,
    ListUsersProvider,
    DeleteUserProvider,
    RestoreUserProvider,
    ToggleUserStatusProvider,
    UploadAvatarProvider,
    UserService,
  ],
  exports: [FindOneUserProvider, CreateUserProvider, UpdateUserProvider],
})
export class UserModule {}
