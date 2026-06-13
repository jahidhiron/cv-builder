import { User } from '@/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('login_histories')
export class LoginHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo: Record<string, unknown> | null;

  @Column({ name: 'client_location', type: 'jsonb', nullable: true })
  clientLocation: Record<string, unknown> | null;

  @Column({ name: 'family_id', type: 'varchar', length: 255, nullable: true })
  familyId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 16, nullable: true })
  sessionId: string | null;

  @Column({ name: 'logged_in_at', type: 'timestamptz', nullable: true })
  loggedInAt: Date | null;

  @Column({ name: 'logged_out_at', type: 'timestamptz', nullable: true })
  loggedOutAt: Date | null;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
