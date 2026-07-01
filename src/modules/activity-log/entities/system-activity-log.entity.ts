import { BaseEntity } from '@/common/base/entities';
import { Column, Entity, Index } from 'typeorm';
import { LogStatus } from '../enums';

@Entity('system_activity_logs')
export class SystemActivityLog extends BaseEntity {
  @Index()
  @Column({ type: 'bigint', nullable: true, name: 'request_log_id' })
  requestLogId!: number | null;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  module!: string;

  @Column({ type: 'varchar', length: 128, name: 'class_name' })
  className!: string;

  @Column({ type: 'varchar', length: 128 })
  fn!: string;

  @Column({ type: 'varchar', length: 16, default: LogStatus.Success })
  status!: LogStatus;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true, name: 'executed_at' })
  executedAt!: Date | null;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  userId!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  input!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  output!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;
}
