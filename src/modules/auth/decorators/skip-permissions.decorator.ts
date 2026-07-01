import { SetMetadata } from '@nestjs/common';

export const SKIP_PERMISSIONS_KEY = 'skipPermissions';

/**
 * Bypasses the `PermissionsGuard` check entirely for the decorated route or controller.
 *
 * Use sparingly — typically for admin-only or internal endpoints where a coarser
 * guard (e.g. `AdminGuard`) already protects access.
 *
 */
export const SkipPermissions = () => SetMetadata(SKIP_PERMISSIONS_KEY, true);
