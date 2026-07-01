import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares the exact permission strings required to access a route.
 * Evaluated by `PermissionsGuard` — overrides the automatic `resource:action` inference.
 *
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
