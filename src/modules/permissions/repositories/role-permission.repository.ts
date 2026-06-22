import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Repository for the `role_permissions` join table.
 *
 * Provides standard CRUD access to role–permission assignment records.
 * Used by {@link AssignRolePermissionsProvider} to bulk-insert new assignments
 * and by {@link RemoveRolePermissionProvider} to hard-delete individual ones.
 * Extends {@link BaseRepository} so all generic query helpers are available.
 */
@Injectable()
export class RolePermissionRepository extends BaseRepository<RolePermission> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, RolePermission, 'role_permission', errorResponse, logger);
  }
}
