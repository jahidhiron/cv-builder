import { ConfigModule } from '@/config';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { RoleService } from '@/modules/roles/services';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [RoleRepository, RoleService],
  exports: [RoleService],
})
export class RoleModule {}
