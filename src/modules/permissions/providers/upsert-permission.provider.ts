import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';
import { In } from 'typeorm';

/**
 * Batch-upserts permissions for the admin permission sync flow.
 *
 * @module Permission
 */
@Injectable()
export class UpsertPermissionProvider {
  constructor(private readonly repo: PermissionRepository) {}

  /**
   * Finds all existing permissions whose keys are in `items`, then batch-creates
   * the ones that are absent. Returns the IDs of every permission (existing and
   * newly created) together with a count of how many rows were inserted.
   *
   * Two DB calls total regardless of how many items are provided:
   * 1. `SELECT … WHERE key IN (…)` — fetch already-existing rows.
   * 2. Bulk `INSERT` — create only the missing ones.
   *
   * @param items       - Permission keys and display names to upsert.
   * @param adminUserId - ID stamped on `createdBy` / `updatedBy` for new rows.
   * @returns `permissionIds` — IDs of all permissions (existing + new);
   *          `created` — number of rows inserted in this call.
   */
  @SystemLog(ModuleName.Permission)
  async execute({
    items,
    adminUserId,
  }: {
    items: { key: string; name: string }[];
    adminUserId: number;
  }): Promise<{ permissionIds: number[]; created: number }> {
    if (!items.length) return { permissionIds: [], created: 0 };

    const keys = items.map((i) => i.key);
    const existing = await this.repo.findMany({ key: In(keys) });
    const existingByKey = new Map(existing.map((p) => [p.key, p]));

    const toCreate = items.filter((i) => !existingByKey.has(i.key));
    const newPermissions = toCreate.length
      ? await this.repo.createMany(
          toCreate.map(
            ({ key, name }) =>
              ({
                key,
                name,
                description: 'Auto-synced from route metadata',
                createdBy: adminUserId,
                updatedBy: adminUserId,
              }) as DeepPartial<Permission>,
          ),
        )
      : [];

    return {
      permissionIds: [
        ...existing.map((p) => Number(p.id)),
        ...newPermissions.map((p) => Number(p.id)),
      ],
      created: newPermissions.length,
    };
  }
}