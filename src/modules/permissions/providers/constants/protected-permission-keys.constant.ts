/**
 * Core permission keys seeded by the initial RBAC migration.
 *
 * These keys are always retained on the Admin role during a sync, even if no
 * running route currently references them. This prevents an accidental code
 * removal or a cold-start scan from stripping fundamental admin capabilities.
 */
export const PROTECTED_PERMISSION_KEYS = new Set([
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:delete',
  'roles:restore',
  'roles:manage-permissions',
  'users:create',
  'users:read',
  'users:update',
  'users:delete',
  'users:restore',
]);
