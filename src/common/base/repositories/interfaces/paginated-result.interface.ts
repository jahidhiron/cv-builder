/** Return shape of `BaseRepository.paginatedList` — a page of items plus pagination metadata. */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    pages: number;
    currentPage: number;
  };
}
