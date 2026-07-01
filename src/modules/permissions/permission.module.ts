import { ActivityLogModule } from '@/modules/activity-log/activity-log.module';
import { ConfigModule } from '@/config';
import {
  AssignRolePermissionsProvider,
  BulkDeletePermissionsProvider,
  BulkRemoveRolePermissionsProvider,
  CreatePermissionProvider,
  DeletePermissionProvider,
  FindAllPermissionsProvider,
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
 * Exports {@link PermissionService}, both repositories, and the role–permission
 * providers ({@link AssignRolePermissionsProvider}, {@link RemoveRolePermissionProvider},
 * {@link ListRolePermissionsProvider}, {@link FindPermissionKeysByRoleProvider})
 * so that {@link RoleModule} can manage role–permission relationships without
 * importing the full module.
 *
 * @module Permission
 */
@Module({
  imports: [ConfigModule, ActivityLogModule],
  controllers: [PermissionController],
  providers: [
    PermissionRepository,
    RolePermissionRepository,
    FindOnePermissionProvider,
    CreatePermissionProvider,
    UpdatePermissionProvider,
    DeletePermissionProvider,
    ListPermissionsProvider,
    ListRolePermissionsProvider,
    AssignRolePermissionsProvider,
    RemoveRolePermissionProvider,
    BulkRemoveRolePermissionsProvider,
    BulkDeletePermissionsProvider,
    FindAllPermissionsProvider,
    FindPermissionKeysByRoleProvider,
    FindRolePermissionsByRoleProvider,
    UpsertPermissionProvider,
    PermissionService,
  ],
  exports: [
    PermissionRepository,
    RolePermissionRepository,
    ListRolePermissionsProvider,
    AssignRolePermissionsProvider,
    RemoveRolePermissionProvider,
    BulkRemoveRolePermissionsProvider,
    BulkDeletePermissionsProvider,
    FindAllPermissionsProvider,
    FindPermissionKeysByRoleProvider,
    PermissionService,
  ],
})
export class PermissionModule {}
