import { RangeCondition } from './range-condition.interface';

/**
 * Custom query filter type for `list` / `paginatedList`.
 *
 * Each entity field can be matched by equality (primitive value) or by a
 * `RangeCondition` object (`$gte`, `$lte`, `$gt`, `$lt`, `$eq`, `$ne`).
 * Nested relation objects are also supported via recursion.
 */
export type QueryFilter<T> = {
  [K in keyof T]?: string | number | boolean | Date | null | RangeCondition;
};
