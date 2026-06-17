import { ConfigModule } from '@/config';
import {
  AssignRolePermissionsProvider,
  CreatePermissionProvider,
  DeletePermissionProvider,
  FindOnePermissionProvider,
  ListPermissionsProvider,
  ListRolePermissionsProvider,
  RemoveRolePermissionProvider,
  UpdatePermissionProvider,
} from '@/modules/permissions/providers';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

@Module({
  imports: [ConfigModule],
  controllers: [PermissionController],
  providers: [
    PermissionRepository,
    RolePermissionRepository,
    // Providers
    FindOnePermissionProvider,
    CreatePermissionProvider,
    UpdatePermissionProvider,
    DeletePermissionProvider,
    ListPermissionsProvider,
    ListRolePermissionsProvider,
    AssignRolePermissionsProvider,
    RemoveRolePermissionProvider,
    // Service
    PermissionService,
  ],
  exports: [
    PermissionRepository,
    RolePermissionRepository,
    ListRolePermissionsProvider,
    AssignRolePermissionsProvider,
    RemoveRolePermissionProvider,
    PermissionService,
  ],
})
export class PermissionModule {}
