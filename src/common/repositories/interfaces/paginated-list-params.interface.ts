import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere } from 'typeorm';

export interface PaginatedListParams<T> {
  q?: string;
  searchBy?: (keyof T | string)[];
  query?: FindOptionsWhere<T>;
  page?: number;
  limit?: number;
  sortBy?: { whom: string; order: 'asc' | 'desc' | 'ASC' | 'DESC' }[];
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
}
