import { BaseRepository } from '@/common/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PermissionRepository extends BaseRepository<Permission> {
  constructor(dataSource: DataSource, errorResponse: ErrorResponse, logger: AppLogger) {
    super(dataSource, Permission, 'permission', errorResponse, logger);
  }

  async findKeysByRoleId(roleId: number): Promise<string[]> {
    const results = await this.rawQuery<{ key: string }>(
      'SELECT p.key FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = $1',
      [roleId],
    );
    return results.map((r) => r.key);
  }
}
