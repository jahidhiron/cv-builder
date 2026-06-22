import type { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { BaseProvider, type FindOneOptions } from './base.provider';

/**
 * Abstract base for providers that retrieve a single entity by its conditions.
 *
 * Delegates to the shared `findOne` helper from {@link BaseProvider}, which
 * throws a 404 when no row is found. Concrete classes only need a constructor
 * — no `execute` override is required unless additional logic is needed.
 *
 * The optional `options` argument is forwarded to
 * {@link BaseProvider.findOne} so callers can eager-load relations, select
 * specific columns, or apply sort order when needed.
 *
 * @template T - The TypeORM entity type managed by this provider.
 */
export abstract class BaseFindOneProvider<T extends ObjectLiteral> extends BaseProvider<T> {
  /** No-options call: 404-throwing, resolves to `T`. */
  override execute(where: FindOptionsWhere<T>): Promise<T>;
  /** Options without `throwError` (or with `throwError: true`): 404-throwing, resolves to `T`. */
  override execute(where: FindOptionsWhere<T>, options: FindOneOptions<T, true>): Promise<T>;
  /** Options with `throwError: false`: resolves to `T | null`. */
  override execute(
    where: FindOptionsWhere<T>,
    options: FindOneOptions<T, false>,
  ): Promise<T | null>;
  /** Fallback overload — for callers whose `throwError` is not statically known; return type widens to `T | null`. */
  override execute(
    where: FindOptionsWhere<T>,
    options?: FindOneOptions<T, boolean>,
  ): Promise<T | null>;
  /**
   * Finds a single entity matching `where` or throws a 404.
   *
   * @param where   - TypeORM `FindOptionsWhere` conditions.
   * @param options - Optional relations, column selection, sort order, and
   *                  error-handling toggle.
   * @returns The matched entity, or `null` when `options.throwError` is
   *          `false` and no row matches.
   */
  override async execute(
    where: FindOptionsWhere<T>,
    options?: FindOneOptions<T, boolean>,
  ): Promise<T | null> {
    return this.findOne(where, options);
  }
}
