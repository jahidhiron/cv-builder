import { BaseEntity } from './base.entity';
import { UpdateDateColumn } from 'typeorm';

/**
 * Extends {@link BaseEntity} with an `updatedAt` column.
 *
 * Use this for mutable records that need both creation and last-update timestamps.
 * For records that also need soft-delete, extend {@link BaseSoftDeleteEntity} instead.
 */
export abstract class BaseTimestampEntity extends BaseEntity {
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
