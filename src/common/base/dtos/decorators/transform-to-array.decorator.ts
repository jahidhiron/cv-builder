import { Transform } from 'class-transformer';
import { TransformToArrayOptions } from '../types';
import { isArrayOf, isObject } from '../utils';

/**
 * Class-transformer decorator that normalises any incoming value into `T[]`.
 *
 * Handles the following input shapes in order:
 * 1. `null` / `""` / `"[]"` — returns `undefined` (when `emptyAsUndefined` is `true`).
 * 2. Already an array — filtered through `itemGuard` if provided, returned as-is otherwise.
 * 3. JSON string — parsed; the result is then treated as case 2 or 4.
 * 4. Plain object — wrapped in `[value]` when `wrapSingle` is `true`.
 * 5. Anything else — returns `undefined`.
 *
 * Designed for query-param properties (e.g. `sortBy`, `filters`) where clients may
 * send a single object instead of a one-element array.
 *
 * @param opts - {@link TransformToArrayOptions} controlling parsing behaviour.
 *
 * @example
 * ```ts
 * \@TransformToArray<SortByDto>({ itemGuard: isSortByDto })
 * sortBy?: SortByDto[];
 * ```
 */
export const TransformToArray = <T = unknown>(opts: TransformToArrayOptions<T> = {}) =>
  Transform(({ value }) => {
    const { allowJsonString = true, wrapSingle = true, emptyAsUndefined = true, itemGuard } = opts;

    if (value === null) return undefined;

    if (emptyAsUndefined && (value === '' || value === '[]')) {
      return undefined;
    }

    if (Array.isArray(value)) {
      if (isArrayOf<T>(value, itemGuard)) return value as unknown as T[];
      return itemGuard ? value.filter(itemGuard) : (value as unknown as T[]);
    }

    if (allowJsonString && typeof value === 'string') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = undefined;
      }

      if (parsed !== undefined) {
        if (isArrayOf<T>(parsed, itemGuard)) return parsed;
        if (wrapSingle && isObject(parsed)) {
          const arr = [parsed];
          if (!itemGuard || isArrayOf<T>(arr, itemGuard)) return arr as unknown as T[];
          return undefined;
        }
        return undefined;
      }
    }

    if (wrapSingle && isObject(value)) {
      const arr = [value];
      if (!itemGuard || isArrayOf<T>(arr, itemGuard)) return arr as unknown as T[];
      return undefined;
    }

    return undefined;
  });
