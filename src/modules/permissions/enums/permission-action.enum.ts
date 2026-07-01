export enum PermissionAction {
  PermissionCreated = 'permission.created',
  PermissionUpdated = 'permission.updated',
  PermissionDeleted = 'permission.deleted',
  RolePermissionsAssigned = 'role-permission.assigned',
  RolePermissionRemoved = 'role-permission.removed',
  RolePermissionsRemoved = 'role-permissions.bulk-removed',
  PermissionsBulkDeleted = 'permissions.bulk-deleted',
}
