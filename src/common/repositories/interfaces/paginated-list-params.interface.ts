import { FindOptionsRelations, FindOptionsSelect } from 'typeorm';
import { QueryFilter } from './find-options.interface';

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
