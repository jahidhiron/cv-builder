import { ConfigModule } from '@/config';
import {
  AssignRolePermissionsProvider,
  CreatePermissionProvider,
  DeletePermissionProvider,
  FindOnePermissionProvider,
  FindPermissionKeysByRoleProvider,
  FindRolePermissionsByRoleProvider,
  ListPermissionsProvider,
  ListRolePermissionsProvider,
  RemoveRolePermissionProvider,
  UpdatePermissionProvider,
  UpsertPermissionProvider,
} from '@/modules/permissions/providers';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { RolePermissionRepository } from '@/modules/permissions/repositories/role-permission.repository';
import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

/**
 * Feature module that wires up all permission-management concerns:
 * CRUD operations on permissions and role–permission assignments.
 *
 * Exports repositories and the three role–permission providers so that
 * `RoleModule` can assign/revoke permissions without importing the full module.
 */
@Module({
  imports: [ConfigModule],
  controllers: [PermissionController],
  providers: [
    // Repositories
    PermissionRepository,
    RolePermissionRepository,
    // CRUD providers (extend base providers)
    FindOnePermissionProvider,
    CreatePermissionProvider,
    UpdatePermissionProvider,
    DeletePermissionProvider,
    ListPermissionsProvider,
    // Specialised role–permission providers
    ListRolePermissionsProvider,
    AssignRolePermissionsProvider,
    RemoveRolePermissionProvider,
    FindPermissionKeysByRoleProvider,
    FindRolePermissionsByRoleProvider,
    UpsertPermissionProvider,
    // Service
    PermissionService,
  ],
  exports: [
    PermissionRepository,
    RolePermissionRepository,
    ListRolePermissionsProvider,
    AssignRolePermissionsProvider,
    RemoveRolePermissionProvider,
    FindPermissionKeysByRoleProvider,
    UpsertPermissionProvider,
    PermissionService,
  ],
})
export class PermissionModule {}
