import { BaseSoftDeleteEntity } from '@/common/base/entities';
import { Sensitive } from '@/modules/activity-log/decorators';
import { Role } from '@/modules/roles/entities/role.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Core user entity for the CV Builder platform.
 *
 * Notable design decisions:
 * - `googleId` is set for OAuth users; these accounts have no `password`.
 * - `failedAttempts` + `lockedUntil` implement brute-force lock-out logic in `SigninProvider`.
 * - `isActive` allows manual suspension without deleting the record.
 */
@Entity('users')
export class User extends BaseSoftDeleteEntity {
  @Column({ type: 'bigint' })
  roleId!: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId?: string | null;

  @Column({ length: 255, unique: true })
  email!: string;

  @Sensitive()
  @Column({ type: 'text', nullable: true })
  password?: string | null;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string | null;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ default: 0 })
  failedAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ default: true })
  isActive!: boolean;
}
