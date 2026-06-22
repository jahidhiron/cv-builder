export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    pages: number;
    currentPage: number;
  };
}
