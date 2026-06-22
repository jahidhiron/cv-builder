import { BaseEntity } from '@/common/base/entities';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Immutable audit record of a sign-in or sign-out event.
 *
 * `loggedInAt` is set on sign-in; `loggedOutAt` is set on logout.
 * `deviceInfo` and `clientLocation` are stored as free-form JSONB for
 * future extensibility without schema migrations.
 * `familyId` links the history entry to the refresh-token family so that
 * device-level session activity can be correlated.
 */
@Entity('login_histories')
export class LoginHistory extends BaseEntity {
  @Column({ type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  clientLocation!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  familyId!: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  sessionId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  loggedInAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  loggedOutAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiredAt!: Date | null;
}
