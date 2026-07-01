import { ActivityLogModule } from '@/modules/activity-log/activity-log.module';
import { ConfigModule } from '@/config';
import { RoleModule } from '@/modules/roles/role.module';
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
import { UserRepository } from '@/modules/users/repositories';
import { UserController } from '@/modules/users/user.controller';
import { UserService } from '@/modules/users/user.service';
import { HashModule } from '@/shared/hash/hash.module';
import { R2StorageModule } from '@/shared/storage';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, R2StorageModule, ActivityLogModule, HashModule, RoleModule],
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
    UserExistProvider,
    UserService,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
