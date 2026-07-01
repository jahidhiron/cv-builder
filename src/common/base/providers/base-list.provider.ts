import { ModuleName } from '@/common/base/enums';
import { ListParams, ListResult } from '@/common/base/repositories/interfaces';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that return a flat list of entities.
 *
 * Exposes `buildParams` as the single override point — override it in the
 * concrete class to supply entity-specific filters, search columns, and sort
 * options without repeating the `execute` wiring.
 *
 * For paginated results with page/total metadata, use {@link BasePaginatedListProvider}.
 *
 * @template T - The TypeORM entity type managed by this provider.
 * @template D - The query DTO type accepted by `execute`. Defaults to `ListParams<T>`.
 */
export abstract class BaseListProvider<
  T extends ObjectLiteral,
  D = ListParams<T>,
> extends BaseProvider<T> {
  /**
   * Maps the incoming DTO to the `ListParams<T>` expected by the repository.
   * The base implementation is a direct cast; override to specify `query`,
   * `searchBy`, `sortBy`, or any other entity-specific list options.
   *
   * @param dto - The incoming query DTO.
   * @returns Repository list params.
   */
  protected buildParams(dto: D): ListParams<T> {
    return dto as unknown as ListParams<T>;
  }

  /**
   * Returns all matching entities as a flat array.
   *
   * @param dto - Query parameters forwarded to `buildParams`.
   * @returns `{ items }` — the matched entities.
   */
  @SystemLog(ModuleName.Common)
  override async execute(dto: D): Promise<ListResult<T>> {
    return this.repo.list(this.buildParams(dto));
  }
}
