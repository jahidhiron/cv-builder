import { BaseTimestampEntity } from '@/common/base/entities';
import { Column, Entity } from 'typeorm';

/**
 * Represents a single permission in the RBAC system.
 *
 * `key` follows the `domain:action` convention (e.g. `users:read`, `roles:delete`).
 * Keys are embedded in JWTs at sign-in time by `PermissionRepository.findKeysByRoleId`
 * so that `PermissionsGuard` can evaluate access without a DB round-trip on each request.
 * Changing or removing a key invalidates all tokens that carry it until re-issued.
 */
@Entity('permissions')
export class Permission extends BaseTimestampEntity {
  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 100, unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'bigint', nullable: true })
  createdBy?: number | null;

  @Column({ type: 'bigint', nullable: true })
  updatedBy?: number | null;
}
