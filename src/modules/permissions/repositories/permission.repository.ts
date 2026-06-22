import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Repository for the `permissions` table. */
@Injectable()
export class PermissionRepository extends BaseRepository<Permission> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, Permission, 'permission', errorResponse, logger);
  }
}
