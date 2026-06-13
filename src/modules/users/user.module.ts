import { ConfigModule } from '@/config';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
