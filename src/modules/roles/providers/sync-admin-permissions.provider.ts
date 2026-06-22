import { PERMISSIONS_KEY } from '@/modules/auth/decorators/require-permissions.decorator';
import { SKIP_PERMISSIONS_KEY } from '@/modules/auth/decorators/skip-permissions.decorator';
import { UserRole } from '@/modules/auth/enums';
import { AssignRolePermissionsProvider } from '@/modules/permissions/providers';
import { UpsertPermissionProvider } from '@/modules/permissions/providers/upsert-permission.provider';
import { FindOneRoleProvider } from '@/modules/roles/providers/find-one-role.provider';
import { Injectable } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

const REQUEST_METHOD_ACTION: Record<number, string> = {
  0: 'read',    // GET
  1: 'create',  // POST
  2: 'update',  // PUT
  3: 'delete',  // DELETE
  4: 'update',  // PATCH
};

export interface SyncAdminPermissionsResult {
  totalDiscovered: number;
  created: number;
  assigned: number;
}

@Injectable()
export class SyncAdminPermissionsProvider {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly upsertPermissionProvider: UpsertPermissionProvider,
    private readonly findOneRoleProvider: FindOneRoleProvider,
    private readonly assignRolePermissionsProvider: AssignRolePermissionsProvider,
  ) {}

  async execute(adminUserId: number): Promise<SyncAdminPermissionsResult> {
    const discovered = this.discoverPermissionKeys();

    let created = 0;
    const permissionIds: number[] = [];

    for (const { key, name } of discovered) {
      const { permission, created: wasCreated } = await this.upsertPermissionProvider.execute(
        key,
        name,
        adminUserId,
      );
      if (wasCreated) created++;
      permissionIds.push(Number(permission.id));
    }

    const adminRole = await this.findOneRoleProvider.execute({ name: UserRole.Admin, isDeleted: false });

    const assigned = await this.assignRolePermissionsProvider.execute({
      roleId: Number(adminRole.id),
      dto: { permissionIds },
    });

    return {
      totalDiscovered: discovered.length,
      created,
      assigned: assigned.length,
    };
  }

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

  private keyToName(key: string): string {
    const [module, action] = key.split(':');
    const capitalize = (s: string) =>
      s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `${capitalize(module ?? key)}: ${capitalize(action ?? '')}`.trim();
  }
}
