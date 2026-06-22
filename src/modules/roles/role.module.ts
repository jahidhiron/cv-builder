import { ConfigModule } from '@/config';
import { PermissionModule } from '@/modules/permissions/permission.module';
import {
  CreateRoleProvider,
  DeleteRoleProvider,
  FindOneRoleProvider,
  ListRolesProvider,
  RestoreRoleProvider,
  SyncAdminPermissionsProvider,
  UpdateRoleProvider,
} from '@/modules/roles/providers';
import { RoleRepository } from '@/modules/roles/repositories';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

/**
 * Feature module that wires up all role-management concerns:
 * CRUD operations, soft-delete/restore, and role–permission assignments.
 *
 * Exports `RoleService` so other modules (e.g. auth) can query roles
 * without importing the full module.
 */
@Module({
  imports: [ConfigModule, PermissionModule, DiscoveryModule],
  controllers: [RoleController],
  providers: [
    RoleRepository,
    FindOneRoleProvider,
    CreateRoleProvider,
    UpdateRoleProvider,
    DeleteRoleProvider,
    RestoreRoleProvider,
    ListRolesProvider,
    SyncAdminPermissionsProvider,
    RoleService,
  ],
  exports: [RoleService],
})
export class RoleModule {}
