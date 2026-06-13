import { ConfigModule } from '@/config';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [RoleRepository],
  exports: [RoleRepository],
})
export class RoleModule {}
