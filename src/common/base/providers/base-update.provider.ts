import type { DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that update an existing entity by a `where` condition.
 *
 * Performs a 404 check before updating and rejects soft-deleted entities.
 * Exposes two override points:
 * - `beforeUpdate` — pre-update hook for validation or side-effects (e.g. name-conflict checks).
 * - `buildPayload`  — shapes the DTO into the data merged into the entity; override to add
 *                     computed fields such as `updatedBy`.
 *
 * @template T - The TypeORM entity type managed by this provider.
 * @template D - The DTO type accepted by `execute`. Defaults to `DeepPartial<T>`.
 */
export abstract class BaseUpdateProvider<
  T extends ObjectLiteral,
  D = DeepPartial<T>,
> extends BaseProvider<T> {
  /**
   * Called after the entity is found but before it is persisted. Override to
   * add pre-update guards such as name-conflict checks.
   *
   * @param _entity - The existing entity fetched from the database.
   * @param _dto    - The incoming DTO.
   */
  protected async beforeUpdate(_entity: T, _dto: D): Promise<void> {}

  /**
   * Transforms the DTO into the payload merged into the entity. The base
   * implementation is a clean pass-through; override to enrich with computed
   * fields (e.g. `{ ...dto, updatedBy: this.request.user?.id }`).
   *
   * @param dto - The incoming DTO.
   * @returns The data object to merge and persist.
   */
  protected buildPayload(dto: D): DeepPartial<T> | Promise<DeepPartial<T>> {
    return dto as unknown as DeepPartial<T>;
  }

  /**
   * Called after the entity has been successfully persisted. Override to add
   * post-update side-effects such as activity logging or cache invalidation.
   *
   * @param _entity - The updated entity.
   * @param _dto    - The DTO that was applied.
   */
  protected async afterUpdate(_entity: T, _dto: D): Promise<void> {}

  /**
   * Finds the entity matching `where`, guards against soft-deleted records, runs
   * `beforeUpdate`, then merges and persists the updated payload.
   *
   * @param where - TypeORM `FindOptionsWhere` conditions (e.g. `{ id }` from a route param).
   * @param dto   - Data transfer object with the fields to update.
   * @returns The updated entity.
   */
  override async execute(where: FindOptionsWhere<T>, dto: D): Promise<T> {
    const entity = await this.findOne(where);
    if ('isDeleted' in entity && (entity as unknown as { isDeleted: boolean }).isDeleted) {
      await this.errorResponse.notFound({
        module: this.module,
        key: `${this.entityName}-not-found`,
      });
    }
    await this.beforeUpdate(entity, dto);
    const updated = await this.repo.update(where, await this.buildPayload(dto));
    await this.afterUpdate(updated!, dto);
    return updated!;
  }
}
