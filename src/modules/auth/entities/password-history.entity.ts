import { BaseEntity } from '@/common/base/entities';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Immutable record of a previous password hash for a user.
 *
 * Used to enforce password-reuse prevention: the last N hashes are checked
 * before any new password is accepted (change or reset flows).
 *
 * Rows are never updated — only inserted and periodically pruned so that at
 * most PASSWORD_HISTORY_LIMIT rows per user are kept.
 */
@Entity('password_histories')
export class PasswordHistory extends BaseEntity {
  @Column({ type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  passwordHash!: string;
}
