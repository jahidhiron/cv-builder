/** Return shape of `BaseRepository.list` — a flat, unpaginated result set. */
export interface ListResult<T> {
  items: T[];
}
