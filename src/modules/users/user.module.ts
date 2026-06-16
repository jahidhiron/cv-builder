import { ConfigModule } from '@/config';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { UserService } from '@/modules/users/services';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
