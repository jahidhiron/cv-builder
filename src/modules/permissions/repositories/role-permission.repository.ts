import { BaseRepository } from '@/common/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { RolePermission } from '@/modules/permissions/entities/role-permission.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RolePermissionRepository extends BaseRepository<RolePermission> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, RolePermission, 'role_permission', errorResponse, logger);
  }

  findByRole(roleId: number): Promise<RolePermission[]> {
    return this.findMany({ roleId });
  }
}
