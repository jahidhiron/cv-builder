import { RawUpdateResult } from '@/common/repositories/helpers/types';

export function getAffectedCount(result: RawUpdateResult): number {
  if (Array.isArray(result)) {
    return result.length ? getAffectedCount(result[0]) : 0;
  }

  return result.rowCount;
}
