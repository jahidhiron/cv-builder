import { AUTH_TYPE_KEY } from '@/modules/auth/constants';
import { PERMISSIONS_KEY } from '@/modules/auth/decorators/require-permissions.decorator';
import { SKIP_PERMISSIONS_KEY } from '@/modules/auth/decorators/skip-permissions.decorator';
import { AuthType } from '@/modules/auth/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

const METHOD_ACTION_MAP: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

/**
 * RBAC guard that enforces permission requirements on protected routes.
 *
 * Permission resolution (first match wins):
 * 1. `@SkipPermissions()` — passes the request unconditionally (admin-only bypass).
 * 2. `@RequirePermissions('resource:action', …)` — checks the explicitly listed
 *    permissions against `request.user.permissions`.
 * 3. Automatic inference — derives `<controllerPath>:<action>` from the HTTP method
 *    and the controller's `@Controller()` path (e.g. `PATCH /users` → `users:update`).
 *
 * Throws `ForbiddenException` when all required permissions are not present.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * @throws {ForbiddenException} When the user lacks one or more required permissions.
   */
  canActivate(context: ExecutionContext): boolean {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (authTypes.includes(AuthType.None)) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const explicit = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    let required: string[];

    if (explicit?.length) {
      required = explicit;
    } else {
      const request = context.switchToHttp().getRequest<Request>();
      const controllerPath = (Reflect.getMetadata(PATH_METADATA, context.getClass()) as string) ?? '';
      const resource = controllerPath.replace(/^\//, '');
      const action = METHOD_ACTION_MAP[request.method] ?? 'read';
      required = [`${resource}:${action}`];
    }

    const { user } = context.switchToHttp().getRequest<Request & { user?: UserPayload }>();
    const hasAll = required.every((p) => user?.permissions?.includes(p));

    if (!hasAll) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
