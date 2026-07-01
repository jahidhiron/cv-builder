import { StandardResponse } from './interfaces';

/**
 * Type guard that checks whether `input` has a non-null `data` object property,
 * narrowing the type to {@link StandardResponse}.
 *
 * @param input - The value to check, typically a controller's return value.
 * @returns `true` if `input` is an object with a non-null `data` property.
 */
export function hasDataProperty(input: unknown): input is StandardResponse {
  if (typeof input !== 'object' || input === null || !('data' in input)) return false;
  const { data } = input as Record<string, unknown>;
  return typeof data === 'object' && data !== null;
}
