import { BaseEntity } from '@/common/entities';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

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
