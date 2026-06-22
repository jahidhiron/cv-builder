import { FindOptionsRelations, FindOptionsSelect } from 'typeorm';
import { QueryFilter } from './find-options.interface';

/**
 * Input parameters for `BaseRepository.paginatedList`.
 *
 * - `q` — free-text search string applied as `ILIKE %q%` across all `searchBy` columns.
 * - `searchBy` — column names to run the `q` search against (entity keys or raw strings).
 * - `query` — typed equality / range filter applied in addition to the text search.
 * - `sortBy` — ordered list of `{ whom, order }` sort descriptors.
 * - `relations` / `select` — passed straight through to TypeORM `find` options.
 */
export interface PaginatedListParams<T> {
  q?: string;
  searchBy?: (keyof T | string)[];
  query?: QueryFilter<T>;
  page?: number;
  limit?: number;
  sortBy?: { whom: string; order: 'asc' | 'desc' | 'ASC' | 'DESC' }[];
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
}
