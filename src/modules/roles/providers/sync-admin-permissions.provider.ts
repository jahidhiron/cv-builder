import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { PERMISSIONS_KEY } from '@/modules/auth/decorators/require-permissions.decorator';
import { SKIP_PERMISSIONS_KEY } from '@/modules/auth/decorators/skip-permissions.decorator';
import { UserRole } from '@/modules/auth/enums';
import { PermissionService } from '@/modules/permissions/permission.service';
import { PROTECTED_PERMISSION_KEYS } from '@/modules/permissions/providers/constants';
import { RoleAction } from '@/modules/roles/enums/role-action.enum';
import { REQUEST_METHOD_ACTION } from '@/modules/roles/providers/constants';
import { FindOneRoleProvider } from '@/modules/roles/providers/find-one-role.provider';
import { SyncAdminPermissionsResult } from '@/modules/roles/providers/interfaces';
import type { Type } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

/**
 * Provider that discovers all permission-guarded routes in the running application,
 * synchronises them to the Admin role, and prunes stale permissions that no longer exist.
 *
 * On each call it:
 * 1. Scans all registered controllers via NestJS {@link DiscoveryService}.
 * 2. Upserts a `Permission` row for every unique key found (explicit `@RequirePermissions`
 *    keys take priority; routes without one derive a key from `resource:action`).
 * 3. Fetches every permission row from the database (not just those assigned to Admin).
 * 4. Permanently deletes any permission whose key is no longer discovered
 *    and is not in {@link PROTECTED_PERMISSION_KEYS} (the core migration-seeded set).
 * 5. Assigns all discovered permissions to the Admin role in a single batch.
 * 6. Emits a {@link RoleAction.AdminPermissionsSynced} activity-log entry.
 *
 * Routes decorated with `@SkipPermissions` are excluded from discovery.
 *
 * @module Role
 */
@Injectable()
export class SyncAdminPermissionsProvider {
  /**
   * @param discoveryService - NestJS service used to enumerate registered controllers at runtime.
   * @param metadataScanner - NestJS service used to enumerate controller method names.
   * @param reflector - NestJS reflector used to read decorator metadata from controllers and handlers.
   * @param findOneRoleProvider - Provider used to look up the Admin role entity.
   * @param permissionService - Service used to list, assign, upsert, and unassign permissions on the Admin role.
   * @param activityLog - Service used to emit the post-sync activity log entry.
   */
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly findOneRoleProvider: FindOneRoleProvider,
    private readonly permissionService: PermissionService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Runs the full permission discovery, pruning, and sync pipeline for the Admin role.
   *
   * @param adminUserId - ID of the admin user initiating the sync; stamped on created permissions and the activity log.
   * @returns A {@link SyncAdminPermissionsResult} with counts of discovered, created, assigned, and removed permissions.
   */
  @SystemLog(ModuleName.Role)
  async execute({ adminUserId }: { adminUserId: number }): Promise<SyncAdminPermissionsResult> {
    const discovered = this.discoverPermissionKeys();
    const discoveredKeys = new Set(discovered.map((d) => d.key));

    const { permissionIds, created } = await this.permissionService.upsertPermissions({
      items: discovered,
      adminUserId,
    });

    const adminRole = await this.findOneRoleProvider.execute({
      name: UserRole.Admin,
      isDeleted: false,
    });
    const adminRoleId = Number(adminRole.id);

    const allPermissions = await this.permissionService.findAllPermissions();

    const orphanedIds = allPermissions
      .filter((p) => !discoveredKeys.has(p.key) && !PROTECTED_PERMISSION_KEYS.has(p.key))
      .map((p) => Number(p.id));

    const removed = orphanedIds.length
      ? await this.permissionService.bulkDeletePermissions({
          permissionIds: orphanedIds,
          adminUserId,
        })
      : 0;

    const { assigned } = await this.permissionService.assignRolePermissions(adminRoleId, {
      permissionIds,
    });

    const syncResult: SyncAdminPermissionsResult = {
      totalDiscovered: discovered.length,
      created,
      assigned: assigned.length,
      removed,
    };

    this.activityLog.logUser({
      action: RoleAction.AdminPermissionsSynced,
      userId: adminUserId,
      metadata: { ...syncResult },
    });

    return syncResult;
  }

  /**
   * Scans all registered controllers and returns a deduplicated list of permission keys.
   *
   * Explicit keys from `@RequirePermissions` are used as-is. For handlers without an
   * explicit key, a `resource:action` key is derived from the controller path and HTTP method
   * using {@link REQUEST_METHOD_ACTION}. Handlers or controllers decorated with
   * `@SkipPermissions` are excluded.
   *
   * @returns An array of `{ key, name }` objects representing each unique permission discovered.
   */
  private discoverPermissionKeys(): { key: string; name: string }[] {
    const controllers = this.discoveryService.getControllers();
    const seen = new Map<string, { key: string; name: string }>();

    for (const wrapper of controllers) {
      const instance = wrapper.instance as object | null | undefined;
      const metatype = wrapper.metatype as Type<unknown> | null | undefined;
      if (!instance || !metatype) continue;

      const controllerPath = (Reflect.getMetadata(PATH_METADATA, metatype) as string) ?? '';
      const resource = controllerPath.replace(/^\//, '');

      const classSkip = this.reflector.get<boolean>(SKIP_PERMISSIONS_KEY, metatype);

      const prototype = Object.getPrototypeOf(instance) as object;
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const handler = (prototype as Record<string, unknown>)[methodName];
        if (typeof handler !== 'function') continue;

        const httpMethod = Reflect.getMetadata(METHOD_METADATA, handler) as number | undefined;
        if (httpMethod === undefined || httpMethod === null) continue;

        const handlerSkip = this.reflector.get<boolean>(SKIP_PERMISSIONS_KEY, handler);
        if (classSkip || handlerSkip) continue;

        const explicit = this.reflector.get<string[]>(PERMISSIONS_KEY, handler);
        if (explicit?.length) {
          for (const k of explicit) {
            if (!seen.has(k)) seen.set(k, { key: k, name: this.keyToName(k) });
          }
        } else if (resource) {
          const action = REQUEST_METHOD_ACTION[httpMethod];
          if (action) {
            const k = `${resource}:${action}`;
            if (!seen.has(k)) seen.set(k, { key: k, name: this.keyToName(k) });
          }
        }
      }
    }

    return [...seen.values()];
  }

  /**
   * Converts a `resource:action` permission key into a human-readable display name.
   *
   * @param key - Permission key in `resource:action` format (e.g. `roles:create`).
   * @returns A title-cased string (e.g. `"Roles: Create"`).
   */
  private keyToName(key: string): string {
    const [module, action] = key.split(':');
    const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `${capitalize(module ?? key)}: ${capitalize(action ?? '')}`.trim();
  }
}
