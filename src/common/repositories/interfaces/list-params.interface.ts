import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere } from 'typeorm';

export interface ListParams<T> {
  q?: string;
  searchBy?: (keyof T | string)[];
  query?: FindOptionsWhere<T>;
  sortBy?: { whom: string; order: 'asc' | 'desc' | 'ASC' | 'DESC' }[];
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
}
