import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that delete an entity by a `where` condition.
 *
 * Resolves the entity first (throwing 404 if absent), then delegates to either
 * a hard delete (`repo.remove`) or a soft delete (`repo.softDelete`) depending
 * on the `force` flag. Exposes `beforeDelete` as an override point for
 * pre-deletion guards (e.g. preventing removal of protected records).
 *
 * @template T - The TypeORM entity type managed by this provider.
 */
export abstract class BaseDeleteProvider<T extends ObjectLiteral> extends BaseProvider<T> {
  /**
   * Called after the entity is found but before deletion. Override to add
   * pre-deletion guards such as protecting system-managed records.
   *
   * @param _entity - The entity about to be deleted.
   */
  protected async beforeDelete(_entity: T): Promise<void> {}

  /**
   * Called after the entity has been successfully deleted. Override to add
   * post-deletion side-effects such as activity logging or cache invalidation.
   *
   * @param _entity - The entity that was deleted.
   * @param _force  - Whether the deletion was a hard delete.
   */
  protected async afterDelete(_entity: T, _force: boolean): Promise<void> {}

  /**
   * Deletes an entity matching `where`.
   *
   * @param where  - TypeORM `FindOptionsWhere` conditions (e.g. `{ id }` from a route param).
   * @param userId - ID of the authenticated user (recorded as `deletedBy` on soft delete).
   * @param force  - When `true`, permanently removes the row; otherwise soft-deletes it.
   */
  @SystemLog(ModuleName.Common)
  override async execute(where: FindOptionsWhere<T>, userId: number, force = false): Promise<void> {
    const entity = await this.findOne(where);
    await this.beforeDelete(entity);
    if (force) {
      await this.repo.remove(where);
    } else {
      await this.repo.softDelete(where, userId);
    }
    await this.afterDelete(entity, force);
  }
}
