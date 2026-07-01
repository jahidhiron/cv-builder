import { BaseEntity } from '@/common/base/entities';
import { Column, Entity, Index } from 'typeorm';

@Entity('request_logs')
export class RequestLog extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36, name: 'request_id' })
  requestId!: string;

  @Column({ type: 'varchar', length: 10 })
  method!: string;

  @Index()
  @Column({ type: 'varchar', length: 256 })
  endpoint!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'user_agent' })
  userAgent!: string | null;

  @Index()
  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  userId!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  body!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'query_params' })
  queryParams!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'path_params' })
  pathParams!: Record<string, unknown> | null;

  @Index()
  @Column({ type: 'smallint', nullable: true, name: 'status_code' })
  statusCode!: number | null;

  @Column({ type: 'int', nullable: true, name: 'duration_ms' })
  durationMs!: number | null;
}
