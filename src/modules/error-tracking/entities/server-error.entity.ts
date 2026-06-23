import { ServerErrorStatus } from '@/modules/error-tracking/enums/server-error-status.enum';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Tracks each unique 500-level error by fingerprint (SHA-256 of error class +
 * message + top stack frame).
 *
 * Each repeat of the same error increments `occurrenceCount` and updates
 * `lastSeenAt` atomically via an ON CONFLICT upsert. `status` reflects the
 * current review state managed by administrators. A first-occurrence email is
 * sent only when `status` is `pending` (i.e. brand-new fingerprint).
 */
@Entity('server_errors')
export class ServerError {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  fingerprint!: string;

  @Column({ type: 'varchar', length: 255 })
  errorName!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 10 })
  method!: string;

  @Column({ type: 'text' })
  path!: string;

  @Column({ type: 'text', nullable: true })
  stack!: string | null;

  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    default: ServerErrorStatus.Pending,
  })
  status!: ServerErrorStatus;

  @Column({ type: 'int', default: 1 })
  occurrenceCount!: number;

  @Column({ type: 'timestamptz' })
  firstSeenAt!: Date;

  @Column({ type: 'timestamptz' })
  lastSeenAt!: Date;

  /** Set once when the first-occurrence admin email is successfully queued. */
  @Column({ type: 'timestamptz', nullable: true })
  emailSentAt!: Date | null;
}
