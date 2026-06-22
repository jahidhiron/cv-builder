/**
 * Narrows `x` to a non-null object (`Record<string, unknown>`).
 * Excludes `null` even though `typeof null === 'object'`.
 *
 * @param x - Value to test.
 * @returns `true` when `x` is a plain object (arrays also satisfy this — callers
 *          should check `Array.isArray` first when that distinction matters).
 */
export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/**
 * Narrows `x` to `T[]`.
 *
 * When `itemGuard` is provided every element must pass the type predicate for the
 * function to return `true`. Without a guard the check is structural only
 * (`Array.isArray`) and the cast is assumed correct by the caller.
 *
 * @param x         - Value to test.
 * @param itemGuard - Optional per-element type predicate.
 * @returns `true` when `x` is an array (and every item satisfies `itemGuard` if supplied).
 */
export function isArrayOf<T>(x: unknown, itemGuard?: (v: unknown) => v is T): x is T[] {
  if (!Array.isArray(x)) return false;
  return itemGuard ? x.every(itemGuard) : true;
}
