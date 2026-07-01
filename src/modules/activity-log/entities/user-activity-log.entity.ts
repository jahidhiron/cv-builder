import { BaseEntity } from '@/common/base/entities';
import { Column, Entity, Index } from 'typeorm';
import { LogStatus } from '../enums';

@Entity('user_activity_logs')
export class UserActivityLog extends BaseEntity {
  @Index()
  @Column({ type: 'bigint', nullable: true })
  userId!: number | null;

  @Index()
  @Column({ type: 'bigint', nullable: true, name: 'request_log_id' })
  requestLogId!: number | null;

  @Column({ type: 'varchar', length: 128 })
  action!: string;

  @Column({ type: 'varchar', length: 16, default: LogStatus.Success })
  status!: LogStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
