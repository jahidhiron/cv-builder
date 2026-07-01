import type { DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';

import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { BaseProvider } from './base.provider';

/**
 * Batch counterpart of {@link BaseUpdateProvider}.
 *
 * Applies a single `repo.updateMany` call for every DTO that
 * matches the supplied `where`. The pipeline mirrors the single-item flow:
 *
 * 1. `repo.findMany(where)` — loads every matched row, throws 404 when the
 *    set is empty or contains a soft-deleted entity, and feeds the first
 *    matched entity to `beforeUpdate`.
 * 2. `beforeUpdate(reference, dto)` — pre-persistence hook, fired once per
 *    DTO so per-row side-effects still run before the bulk write.
 * 3. `buildPayload(dto)` — per-DTO payload shaping; the last payload returned
 *    is what `repo.updateMany` persists against every matched
 *    row (the repository applies one `data` patch to all rows in `where`).
 * 4. `repo.updateMany(where, payload)` — single round-trip bulk update.
 * 5. `afterUpdate(updated, dto)` — post-persistence hook, fired once per
 *    returned entity in input order so per-row side-effects still fire.
 *
 * Note on semantics: `repo.updateMany` applies the same patch
 * to every row matched by `where`, so this batch only makes sense when all
 * DTOs share a target row set (e.g. invalidating N prior refresh tokens for
 * the same user, applying the same status change to N roles). For
 * heterogeneous `where` + per-row data use the single-item
 * {@link BaseUpdateProvider} in a loop instead.
 *
 * If `beforeUpdate` throws, the batch short-circuits and no rows are updated.
 * If `updateMany` itself throws, the per-DTO `afterUpdate` hooks for the
 * already-updated rows are skipped (consistent with how a failing single
 * `execute` would behave).
 *
 * @typeParam T - The entity type managed by the repository.
 * @typeParam D - The patch DTO shape (defaults to `DeepPartial<T>`).
 */
export abstract class BaseUpdateManyProvider<
  T extends ObjectLiteral,
  D = DeepPartial<T>,
> extends BaseProvider<T> {
  /**
   * Called after the entity is found but before it is persisted. Override to
   * add pre-update guards such as name-conflict checks. Fired once per DTO.
   *
   * @param _entity - The existing entity fetched from the database.
   * @param _dto    - The incoming DTO.
   */
  protected async beforeUpdate(_entity: T, _dto: D): Promise<void> {}

  /**
   * Transforms a DTO into the payload merged into the entity. The base
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
   * Called after the entities have been successfully persisted. Override to add
   * post-update side-effects such as activity logging or cache invalidation.
   * Fired once per returned entity in the same order as `dtos`.
   *
   * @param _entity - The updated entity.
   * @param _dto    - The DTO that was applied.
   */
  protected async afterUpdate(_entity: T, _dto: D): Promise<void> {}

  /**
   * Persists updates against every row matching `where` in a single bulk write.
   *
   * @param where - TypeORM `FindOptionsWhere` conditions shared by every DTO.
   * @param dtos  - Patches to apply. Each DTO fires `beforeUpdate` and
   *                `afterUpdate` once; the final payload produced by
   *                {@link buildPayload} is what the bulk update persists.
   * @returns The updated entities returned by
   *          `repo.updateMany`.
   */
  @SystemLog(ModuleName.Common)
  async execute(where: FindOptionsWhere<T>, dtos: D[]): Promise<T[]> {
    const entities = await this.repo.findMany(where);
    if (!entities.length) {
      await this.errorResponse.notFound({
        module: this.module,
        key: `${this.entityName}-not-found`,
      });
    }

    const isAnyDeleted = entities.some(
      (e) => 'isDeleted' in e && (e as unknown as { isDeleted: boolean }).isDeleted,
    );
    if (isAnyDeleted) {
      await this.errorResponse.notFound({
        module: this.module,
        key: `${this.entityName}-not-found`,
      });
    }

    const reference = entities[0];

    let payload: Partial<DeepPartial<T>> = {};
    for (const dto of dtos) {
      await this.beforeUpdate(reference, dto);
      payload = (await this.buildPayload(dto)) as Partial<DeepPartial<T>>;
    }

    const updated = await this.repo.updateMany(where, payload as DeepPartial<T>);

    for (let i = 0; i < updated.length; i += 1) {
      await this.afterUpdate(updated[i], dtos[i]);
    }
    return updated;
  }
}
