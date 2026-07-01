import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that perform a lightweight existence check.
 *
 * Delegates to {@link BaseRepository#exists}, which issues a single
 * `SELECT EXISTS(...)` query — cheaper than `findOne` when the caller
 * only needs a boolean answer and never the full row.
 *
 * Concrete subclasses supply the entity type via `T` and may override
 * `execute` solely to attach module-specific decorators (e.g. `@SystemLog`).
 *
 * @template T - The TypeORM entity type managed by this provider.
 */
export abstract class BaseExistProvider<T extends ObjectLiteral> extends BaseProvider<T> {
  /**
   * Returns `true` when at least one row matches `where`, `false` otherwise.
   *
   * @param where - TypeORM `FindOptionsWhere<T>` conditions.
   */
  @SystemLog(ModuleName.Common)
  override async execute(where: FindOptionsWhere<T>): Promise<boolean> {
    return this.repo.exists(where);
  }
}
