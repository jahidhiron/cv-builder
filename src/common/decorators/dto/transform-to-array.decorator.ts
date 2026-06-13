import { TransformToArrayOptions } from '@/common/decorators/dto/types';
import { Transform } from 'class-transformer';

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isArrayOf<T>(x: unknown, itemGuard?: (v: unknown) => v is T): x is T[] {
  if (!Array.isArray(x)) return false;
  return itemGuard ? x.every(itemGuard) : true;
}

/**
 * Transforms input into an array of T.
 * Supports arrays, single objects, or JSON strings.
 * Useful for query params like sortBy or filters.
 */
export const TransformToArray = <T = unknown>(opts: TransformToArrayOptions<T> = {}) =>
  Transform(({ value }) => {
    const { allowJsonString = true, wrapSingle = true, emptyAsUndefined = true, itemGuard } = opts;

    if (value === null) return undefined;

    if (emptyAsUndefined && (value === '' || value === '[]')) {
      return undefined;
    }

    // Already an array
    if (Array.isArray(value)) {
      if (isArrayOf<T>(value, itemGuard)) {
        return value as unknown as T[];
      }
      const filtered = itemGuard ? value.filter(itemGuard) : (value as unknown as T[]);
      return filtered;
    }

    // JSON string
    if (allowJsonString && typeof value === 'string') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = undefined;
      }

      if (parsed !== undefined) {
        if (isArrayOf<T>(parsed, itemGuard)) {
          return parsed;
        }
        if (wrapSingle && isObject(parsed)) {
          const arr = [parsed];
          if (!itemGuard || isArrayOf<T>(arr, itemGuard)) {
            return arr as unknown as T[];
          }
          return undefined;
        }
        return undefined;
      }
    }

    // Single object
    if (wrapSingle && isObject(value)) {
      const arr = [value];
      if (!itemGuard || isArrayOf<T>(arr, itemGuard)) {
        return arr as unknown as T[];
      }
      return undefined;
    }

    return undefined;
  });
