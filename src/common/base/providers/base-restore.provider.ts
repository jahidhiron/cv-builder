import { BaseSoftDeleteEntity } from '@/common/base/entities';
import type { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that restore a soft-deleted entity by a `where` condition.
 *
 * Resolves the entity first (throwing 404 if absent), then asserts it is
 * currently soft-deleted before restoring it. Exposes `beforeRestore` as an
 * override point for any additional pre-restore logic.
 *
 * Only works with entities that extend {@link BaseSoftDeleteEntity}.
 *
 * @template T - The TypeORM entity type managed by this provider.
 */
export abstract class BaseRestoreProvider<T extends ObjectLiteral> extends BaseProvider<T> {
  /**
   * Called after the entity is found and its archived state is confirmed,
   * but before the restore is persisted. Override for additional side-effects.
   *
   * @param _entity - The soft-deleted entity about to be restored.
   */
  protected async beforeRestore(_entity: T): Promise<void> {}

  /**
   * Called after the entity has been successfully restored. Override to add
   * post-restore side-effects such as activity logging or cache invalidation.
   *
   * @param _entity - The restored entity.
   */
  protected async afterRestore(_entity: T): Promise<void> {}

  /**
   * Restores a soft-deleted entity matching `where`.
   *
   * Throws 400 if the entity is not currently archived.
   *
   * @param where - TypeORM `FindOptionsWhere` conditions (e.g. `{ id }` from a route param).
   * @returns The restored entity.
   */
  override async execute(where: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.findOne(where);

    if (!(entity as unknown as BaseSoftDeleteEntity).isDeleted) {
      return this.errorResponse.badRequest({
        module: this.module,
        key: `${this.entityName}-not-archived`,
      });
    }

    await this.beforeRestore(entity);

    const restored = await this.repo.restore(where);
    await this.afterRestore(restored!);
    return restored!;
  }
}
