import { BaseEntity } from '@/common/entities/base.entity';
import { timestampWithTimezone } from '@/common/utils';
import { Column } from 'typeorm';

/**
 * Base entity with soft-delete functionality.
 *
 * Extend this entity for tables that require soft deletion.
 */
export abstract class BaseSoftDeleteEntity extends BaseEntity {
  /** Flag indicating whether the entity is soft-deleted */
  @Column({ default: false })
  isDeleted: boolean;

  /** Timestamp when the entity was soft-deleted */
  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  /**
   * Soft delete the entity
   */
  softRemove() {
    this.isDeleted = true;
    this.deletedAt = timestampWithTimezone();
  }

  /**
   * Restore a soft-deleted entity
   */
  restore() {
    this.isDeleted = false;
    this.deletedAt = null;
  }
}
