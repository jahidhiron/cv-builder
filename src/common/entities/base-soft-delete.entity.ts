import { BaseTimestampEntity } from '@/common/entities/base-timestamp.entity';
import { timestampWithTimezone } from '@/common/utils';
import { Column } from 'typeorm';

/**
 * Base entity with soft-delete functionality.
 *
 * Extend this entity for tables that require soft deletion.
 */
export abstract class BaseSoftDeleteEntity extends BaseTimestampEntity {
  /** Flag indicating whether the entity is soft-deleted */
  @Column({ default: false })
  isDeleted!: boolean;

  /** Timestamp when the entity was soft-deleted */
  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  /** ID of the user who performed the soft delete */
  @Column({ type: 'bigint', nullable: true })
  deletedBy?: number | null;

  softRemove(deletedBy?: number) {
    this.isDeleted = true;
    this.deletedAt = timestampWithTimezone();
    if (deletedBy !== undefined) this.deletedBy = deletedBy;
  }

  restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
  }
}
