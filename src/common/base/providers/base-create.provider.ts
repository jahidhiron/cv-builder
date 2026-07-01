import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { DeepPartial, ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that create a single entity.
 *
 * Exposes two override points:
 * - `beforeCreate` — pre-creation hook for validation or side-effects (e.g. uniqueness checks).
 * - `buildPayload`  — shapes the DTO into the data passed to the repository; override to add
 *                     computed fields such as `createdBy` or `updatedBy`.
 *
 * @template T - The TypeORM entity type managed by this provider.
 * @template D - The DTO type accepted by `execute`. Defaults to `DeepPartial<T>`.
 */
export abstract class BaseCreateProvider<
  T extends ObjectLiteral,
  D = DeepPartial<T>,
> extends BaseProvider<T> {
  /**
   * Called before the entity is persisted. Override to add pre-creation guards
   * such as duplicate-name checks or permission assertions.
   *
   * @param _dto - The incoming DTO.
   */
  protected async beforeCreate(_dto: D): Promise<void> {}

  /**
   * Transforms the DTO into the payload passed to `repo.create`. The base
   * implementation is a clean pass-through; override to enrich with computed
   * fields (e.g. `{ ...dto, createdBy: this.request.user?.id }`).
   *
   * @param dto - The incoming DTO.
   * @returns The data object to persist.
   */
  protected buildPayload(dto: D): DeepPartial<T> | Promise<DeepPartial<T>> {
    return dto as unknown as DeepPartial<T>;
  }

  /**
   * Called after the entity has been successfully persisted. Override to add
   * post-creation side-effects such as activity logging, notifications, or
   * cache invalidation.
   *
   * @param _entity - The newly created entity.
   */
  protected async afterCreate(_entity: T): Promise<void> {}

  /**
   * Creates and persists a new entity.
   *
   * @param dto - Data transfer object describing the new entity.
   * @returns The newly created entity.
   */
  @SystemLog(ModuleName.Common)
  override async execute(dto: D): Promise<T> {
    await this.beforeCreate(dto);
    const entity = await this.repo.create(await this.buildPayload(dto));
    await this.afterCreate(entity);
    return entity;
  }
}
