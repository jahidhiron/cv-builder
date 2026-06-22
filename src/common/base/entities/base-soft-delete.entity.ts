import { BaseTimestampEntity } from './base-timestamp.entity';
import { timestampWithTimezone } from './utils';
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

  /**
   * Marks the entity as soft-deleted by setting `isDeleted`, `deletedAt`, and optionally `deletedBy`.
   * Called by `BaseRepository.softDelete` before persisting.
   *
   * @param deletedBy - ID of the user performing the deletion. Omit to leave `deletedBy` unchanged.
   */
  softRemove(deletedBy?: number) {
    this.isDeleted = true;
    this.deletedAt = timestampWithTimezone();
    if (deletedBy !== undefined) this.deletedBy = deletedBy;
  }

  /**
   * Clears all soft-delete fields, making the entity visible again.
   * Called by `BaseRepository.restore` before persisting.
   */
  restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
  }
}
