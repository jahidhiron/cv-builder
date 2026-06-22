import { BaseEntity } from '@/common/base/entities';
import { Column, Entity } from 'typeorm';

/**
 * Join table for the many-to-many relationship between roles and permissions.
 * A row exists for each permission granted to a role.
 * Managed by `AssignRolePermissionsProvider` (insert) and `RemoveRolePermissionProvider` (delete).
 */
@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @Column({ type: 'bigint' })
  roleId!: number;

  @Column({ type: 'bigint' })
  permissionId!: number;
}
