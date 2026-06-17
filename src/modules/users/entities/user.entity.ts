import { BaseSoftDeleteEntity } from '@/common/entities';
import { Role } from '@/modules/roles/entities/role.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

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

  @Column({ type: 'text', nullable: true, select: false })
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
