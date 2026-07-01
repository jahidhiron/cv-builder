import { ListOptionsDto } from '@/common/base/dtos/list-options.dto';
import { ModuleName } from '@/common/base/enums';
import { PaginatedListParams, PaginatedResult } from '@/common/base/repositories/interfaces';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Abstract base for providers that return a paginated list of entities.
 *
 * The generic `D` is constrained to {@link ListOptionsDto} so that the base
 * `buildParams` can automatically forward `q`, `page`, `limit`, and `sortBy`
 * from the DTO. Override `buildParams` in the concrete class and spread
 * `super.buildParams(dto)` to add entity-specific `searchBy`, `query`, etc.
 *
 * @template T - The TypeORM entity type managed by this provider.
 * @template D - The query DTO type; must extend {@link ListOptionsDto}.
 */
export abstract class BasePaginatedListProvider<
  T extends ObjectLiteral,
  D extends ListOptionsDto = ListOptionsDto,
> extends BaseProvider<T> {
  /**
   * Maps the incoming DTO to the `PaginatedListParams<T>` expected by the
   * repository. The base implementation forwards the common pagination and
   * sorting fields; override and spread `super.buildParams(dto)` to add
   * `searchBy`, `query`, or other entity-specific options.
   *
   * @param dto - The incoming query DTO.
   * @returns Repository paginated list params.
   */
  protected buildParams(dto: D): PaginatedListParams<T> {
    return {
      q: dto.q,
      page: dto.page,
      limit: dto.limit,
      sortBy: dto.sortBy,
    };
  }

  /**
   * Returns a paginated subset of entities along with page metadata.
   *
   * @param dto - Query parameters forwarded to `buildParams`.
   * @returns `{ items, meta }` where `meta` contains `total`, `pages`, and `currentPage`.
   */
  @SystemLog(ModuleName.Common)
  override async execute(dto: D): Promise<PaginatedResult<T>> {
    return this.repo.paginatedList(this.buildParams(dto));
  }
}
