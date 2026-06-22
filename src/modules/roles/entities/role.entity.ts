import { BaseSoftDeleteEntity } from '@/common/base/entities';
import { Column, Entity } from 'typeorm';

/**
 * Represents a named role in the RBAC system (e.g. `"admin"`, `"user"`).
 *
 * Roles are soft-deletable. The system-reserved `"admin"` and `"user"` roles
 * are protected from deletion by `DeleteRoleProvider`.
 * Permissions are associated via the `role_permissions` join table.
 */
@Entity('roles')
export class Role extends BaseSoftDeleteEntity {
  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'bigint', nullable: true })
  createdBy?: number | null;

  @Column({ type: 'bigint', nullable: true })
  updatedBy?: number | null;
}
