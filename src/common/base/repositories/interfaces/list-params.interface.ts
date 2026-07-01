import { FindOptionsRelations, FindOptionsSelect } from 'typeorm';
import { QueryFilter } from './find-options.interface';

/** Input parameters for `BaseRepository.list`. */
export interface ListParams<T> {
  q?: string;
  searchBy?: (keyof T | string)[];
  query?: QueryFilter<T>;
  /** Sort descriptors: `whom` is the field to sort by, `order` is direction. */
  sortBy?: { whom: string; order: 'asc' | 'desc' | 'ASC' | 'DESC' }[];
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
}
