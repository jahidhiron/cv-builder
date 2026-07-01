import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { DeepPartial, ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that upsert one or many entities.
 *
 * Accepts a single item or an array, runs `beforeUpsert` for side-effects, then
 * maps each item through `buildPayload` before delegating to `repo.upsert`.
 * Exposes two override points:
 * - `beforeUpsert` — pre-upsert hook for validation or enrichment.
 * - `buildPayload`  — shapes a single item into the data passed to the repository.
 *
 * @template T - The TypeORM entity type managed by this provider.
 * @template D - The DTO type for a single item. Defaults to `DeepPartial<T>`.
 */
export abstract class BaseUpsertProvider<
  T extends ObjectLiteral,
  D = DeepPartial<T>,
> extends BaseProvider<T> {
  /**
   * Called before any rows are upserted. Override to add pre-upsert validation
   * or enrichment that applies to the whole batch.
   *
   * @param _data - The single item or array about to be upserted.
   */
  protected async beforeUpsert(_data: D | D[]): Promise<void> {}

  /**
   * Transforms a single DTO into the payload passed to `repo.upsert`. The base
   * implementation is a clean pass-through; override to add computed fields.
   *
   * @param data - A single DTO item.
   * @returns The data object to upsert.
   */
  protected buildPayload(data: D): DeepPartial<T> | Promise<DeepPartial<T>> {
    return data as unknown as DeepPartial<T>;
  }

  /**
   * Upserts one or many entities using PostgreSQL `ON CONFLICT DO UPDATE`.
   *
   * @param data          - Single item or array of items to upsert.
   * @param conflictPaths - Column names that define the uniqueness constraint
   *                        (e.g. `['name']` or `['userId', 'roleId']`).
   */
  @SystemLog(ModuleName.Common)
  override async execute(data: D | D[], conflictPaths: (keyof T & string)[]): Promise<void> {
    await this.beforeUpsert(data);
    const payload = Array.isArray(data)
      ? await Promise.all(data.map((item: D) => Promise.resolve(this.buildPayload(item))))
      : await this.buildPayload(data);
    await this.repo.upsert(payload, conflictPaths);
  }
}
