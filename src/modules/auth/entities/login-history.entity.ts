import { BaseEntity } from '@/common/entities';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

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
