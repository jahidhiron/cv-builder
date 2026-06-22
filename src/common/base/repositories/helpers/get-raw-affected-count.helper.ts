import { RawUpdateResult } from './types';

/**
 * Extracts the number of affected rows from a raw TypeORM update/delete result.
 *
 * TypeORM raw results can be a single object with `rowCount` or a nested array
 * (as returned by some driver adapters). This helper normalises both shapes.
 *
 * @param result - Raw update result from `repo.query(...)` or a `QueryBuilder` execute.
 * @returns Number of rows affected by the operation.
 */
export function getAffectedCount(result: RawUpdateResult): number {
  if (Array.isArray(result)) {
    return result.length ? getAffectedCount(result[0]) : 0;
  }

  return result.rowCount;
}
