import { ModuleName } from '@/common/base/enums';
import { BaseRepository } from '@/common/base/repositories';
import { ErrorResponse } from '@/shared/response';
import type {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';

/**
 * Options accepted by {@link BaseProvider#findOne}.
 *
 * The {@link ThrowError} generic controls the return type of `findOne`:
 * - `true`  (default) — the method throws a 404 and never resolves to `null`,
 *   so the return type is `T`.
 * - `false`            — the method resolves to `null` when no row matches,
 *   so the return type widens to `T | null`.
 *
 * The `throwError` runtime flag defaults to `true` — pass `false` to opt out.
 */
export type FindOneOptions<T extends ObjectLiteral, ThrowError extends boolean = true> = {
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
  order?: FindOptionsOrder<T>;
  /**
   * When `true` (the default), a missing row triggers a 404 `HttpException`.
   * When `false`, the call resolves to `null` instead so the caller can
   * branch on existence without exception handling.
   */
  throwError?: ThrowError;
};

/**
 * Root abstract class for all feature providers.
 *
 * Holds the shared dependencies — `module`, `repo`, and `errorResponse` — and
 * exposes a protected `findOne` helper that throws a 404 when no row is found.
 * Every concrete operation provider (create, update, delete, …) extends one of
 * the specialised sub-classes that in turn extend this class.
 *
 * @template T - The TypeORM entity type managed by this provider.
 */
export abstract class BaseProvider<T extends ObjectLiteral> {
  /**
   * Derives the singular entity name from the module name by stripping a
   * trailing `s` (e.g. `"roles"` → `"role"`). Used to build i18n error keys.
   */
  protected get entityName(): string {
    return this.module.replace(/s$/, '');
  }

  /**
   * @param module        - The {@link ModuleName} enum value for this feature (e.g. `ModuleName.Role`).
   * @param repo          - The entity-specific repository instance.
   * @param errorResponse - Shared helper that throws typed `HttpException`s.
   */
  constructor(
    protected readonly module: ModuleName,
    protected readonly repo: BaseRepository<T>,
    protected readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Looks up a single entity by `where`. By default, throws a 404
   * `HttpException` when no row is found, so callers never need to guard
   * against a `null` return.
   *
   * The optional `options` argument is forwarded straight to
   * {@link BaseRepository#findOne}, allowing callers to eager-load relations,
   * select specific columns, or apply sort order without losing the 404
   * behaviour.
   *
   * Set `options.throwError` to `false` to suppress the 404 and receive
   * `null` instead — useful when the caller wants to branch on existence
   * (e.g. "not found" is a normal control-flow case, not an error).
   *
   * @param where   - TypeORM `FindOptionsWhere` conditions.
   * @param options - Optional relations, column selection, sort order, and
   *                  error-handling toggle.
   * @returns The matched entity, or `null` when `options.throwError` is
   *          `false` and no row matches.
   */
  protected async findOne<TThrow extends boolean = true>(
    where: FindOptionsWhere<T>,
    options?: FindOneOptions<T, TThrow>,
  ): Promise<TThrow extends false ? T | null : T> {
    const { throwError = true, ...repoOptions } = options ?? {};
    const entity = await this.repo.findOne(where, repoOptions);
    if (!entity) {
      if (throwError) {
        return this.errorResponse.notFound({
          module: this.module,
          key: `${this.entityName}-not-found`,
        });
      }
      return null as never;
    }
    return entity as never;
  }

  abstract execute(...args: any[]): Promise<unknown>;
}
