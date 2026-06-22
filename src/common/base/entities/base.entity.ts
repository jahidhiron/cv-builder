import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Minimal base for all entities: auto-increment PK + creation timestamp.
 *
 * Use this for append-only / immutable records (tokens, audit logs, histories).
 * For mutable records that need an `updatedAt` column, extend {@link BaseTimestampEntity}.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
