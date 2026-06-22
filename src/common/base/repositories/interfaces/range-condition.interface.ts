/**
 * MongoDB-style range operators for `QueryFilter` field conditions.
 * Used in `BaseRepository.list` and `paginatedList` to build typed WHERE clauses
 * without raw SQL.
 */
export interface RangeCondition {
  $gte?: number | string;
  $lte?: number | string;
  $gt?: number | string;
  $lt?: number | string;
  $eq?: number | string;
  $ne?: number | string;
}
