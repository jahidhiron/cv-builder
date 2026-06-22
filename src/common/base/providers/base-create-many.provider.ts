import type { DeepPartial, ObjectLiteral } from 'typeorm';

import { BaseProvider } from './base.provider';

/**
 * Batch counterpart of {@link BaseCreateProvider}.
 *
 * The batch pipeline:
 *
 * 1. `beforeCreate(dto)` — per-item pre-persistence hook (mutates each DTO).
 * 2. `buildPayload(dto)` — per-item payload shaping.
 * 3. `repo.createMany(payloads)` — single round-trip bulk insert.
 * 4. `afterCreate(entity)` — per-item post-persistence hook.
 *
 * All `beforeCreate` hooks run first so any side effects (e.g. fetching a
 * device fingerprint or invalidating prior rows) complete before the bulk
 * insert. The bulk insert is a single DB round-trip; the per-item
 * `afterCreate` hooks then run in order.
 *
 * If a `beforeCreate` hook throws, the batch short-circuits and nothing is
 * inserted. If `createMany` itself throws, the per-item `afterCreate` hooks
 * for already-inserted rows are skipped (consistent with how a failing single
 * create would behave).
 *
 * @typeParam T - The entity type managed by the repository.
 * @typeParam D - The create DTO shape (defaults to `DeepPartial<T>`).
 */
export abstract class BaseCreateManyProvider<
  T extends ObjectLiteral,
  D = DeepPartial<T>,
> extends BaseProvider<T> {
  /**
   * Pre-persistence hook fired once per DTO before the bulk insert. Override to
   * enrich or mutate the DTO (e.g. attach a device fingerprint, mark prior
   * rows as superseded). Errors thrown here abort the batch.
   */
  protected async beforeCreate(_dto: D): Promise<void> {}

  /**
   * Builds the actual entity payload persisted by {@link
   * BaseRepository.createMany}. Override to strip DTO-only fields or compute
   * derived columns. Defaults to passing the DTO through as a `DeepPartial<T>`.
   */
  protected buildPayload(dto: D): DeepPartial<T> | Promise<DeepPartial<T>> {
    return dto as unknown as DeepPartial<T>;
  }

  /**
   * Post-persistence hook fired once per inserted entity, in the same order as
   * the input DTOs. Override to fan-out side effects (e.g. audit logging,
   * cache warmup, event emission).
   */
  protected async afterCreate(_entity: T[]): Promise<void> {}

  /**
   * Persists multiple entities in a single bulk insert.
   *
   * @param dtos - List of create payloads to persist.
   * @returns The created entities in the same order as `dtos`.
   */
  async execute(dtos: D[]): Promise<T[]> {
    const payloads: DeepPartial<T>[] = [];
    for (const dto of dtos) {
      await this.beforeCreate(dto);
      payloads.push(await this.buildPayload(dto));
    }

    const created = await this.repo.createMany(payloads);

    await this.afterCreate(created);
    return created;
  }
}
