import { BaseProvider } from '@/common/base/providers/base.provider';
import { ModuleName } from '@/common/base/enums';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import type { FindOrCreatePermissionResult } from '@/modules/permissions/providers/interfaces';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Finds a permission by key or creates it when absent.
 *
 * Designed for sync flows (e.g. admin permission sync) that supply the
 * acting user explicitly rather than reading from the HTTP request context.
 */
@Injectable()
export class UpsertPermissionProvider extends BaseProvider<Permission> {
  constructor(repo: PermissionRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  override async execute(
    key: string,
    name: string,
    adminUserId: number,
  ): Promise<FindOrCreatePermissionResult> {
    const existing = await this.repo.findOne({ key });
    if (existing) return { permission: existing, created: false };

    const permission = await this.repo.create({
      key,
      name,
      description: 'Auto-synced from route metadata',
      createdBy: adminUserId,
      updatedBy: adminUserId,
    } as DeepPartial<Permission>);

    return { permission, created: true };
  }
}
