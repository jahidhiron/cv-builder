import { BaseEntity } from '@/common/base/entities';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/**
 * One-time verification token used for email confirmation and password reset.
 *
 * `type` discriminates between flows: `"email_verification"` or `"password_reset"`.
 * `applied` is set to `true` when the token has been consumed (action executed).
 * `verified` is set to `true` after the token is validated but before the action
 * completes (e.g. password-reset token is verified before the new password is saved).
 *
 * Tokens are deleted from the DB once successfully consumed by `VerifyTokenProvider`.
 */
@Entity('verification_tokens')
export class VerificationToken extends BaseEntity {
  @Column({ length: 255 })
  token!: string;

  @Column({ length: 50 })
  type!: string;

  @Column({ type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'timestamptz' })
  expiredAt!: Date;

  @Column({ default: false })
  applied!: boolean;

  @Column({ default: false })
  verified!: boolean;
}
