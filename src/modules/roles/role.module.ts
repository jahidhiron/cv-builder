import { ConfigModule } from '@/config';
import { PermissionModule } from '@/modules/permissions/permission.module';
import {
  CreateRoleProvider,
  DeleteRoleProvider,
  FindOneRoleProvider,
  ListRolesProvider,
  RestoreRoleProvider,
  UpdateRoleProvider,
} from '@/modules/roles/providers';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { RoleService } from './role.service';
import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';

@Module({
  imports: [ConfigModule, PermissionModule],
  controllers: [RoleController],
  providers: [
    RoleRepository,
    // Providers
    FindOneRoleProvider,
    CreateRoleProvider,
    UpdateRoleProvider,
    DeleteRoleProvider,
    RestoreRoleProvider,
    ListRolesProvider,
    // Service
    RoleService,
  ],
  exports: [RoleService],
})
export class RoleModule {}
