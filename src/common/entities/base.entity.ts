import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Base entity class with common columns for all entities.
 *
 * Extend this class to include `id`, `createdAt`, and `updatedAt` in your entities.
 *
 * @abstract
 */
export abstract class BaseEntity {
  /**
   * Primary key of the entity.
   * Auto-generated integer.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Timestamp when the entity was created.
   * Automatically set by TypeORM when the entity is inserted.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the entity was last updated.
   * Automatically updated by TypeORM whenever the entity is updated.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
