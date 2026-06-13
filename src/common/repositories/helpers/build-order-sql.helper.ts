import { SortByDto } from '@/common/dtos';

/**
 * Generate SQL ORDER BY clause from SortBy rules.
 * Supports nested fields like "profile.id" → "profile_id".
 *
 * @param sortBy - Array of sorting rules
 * @param defaultAlias - Table alias for top-level columns (default: "i")
 * @param defaultOrder - Fallback ORDER BY if sortBy is empty (default: "i.id DESC")
 * @returns SQL string for ORDER BY
 */

export function buildOrderSQL(
  sortBy?: SortByDto[],
  defaultAlias = 'i',
  defaultOrder = 'i.id DESC',
): string {
  if (!sortBy || !sortBy.length) return defaultOrder;

  const parts = sortBy.map((s) => {
    const order = s.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (s.whom.includes('.')) {
      const pathParts = s.whom.split('.');
      const column = pathParts.join('_');
      return `${column} ${order}`;
    }

    return `${defaultAlias}.${s.whom} ${order}`;
  });

  return parts.join(', ');
}
