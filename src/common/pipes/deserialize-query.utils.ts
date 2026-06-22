import { BadRequestException } from '@nestjs/common';
import { JSONValue } from './types';

/**
 * Recursively converts a raw query-parameter value to a typed {@link JSONValue}.
 *
 * Handles all shapes produced by NestJS + Express query parsing:
 * - `"true"` / `"false"` strings → booleans
 * - Numeric strings → numbers
 * - JSON-looking strings (`{…}` / `[…]`) → parsed objects/arrays
 * - Plain strings → unchanged
 * - Arrays → each element converted recursively
 * - Objects → each value converted recursively
 *
 * @param val - The raw value from the parsed query object.
 * @returns The converted value, or `undefined` when `val` is `undefined`.
 * @throws {BadRequestException} When a JSON-looking string cannot be parsed.
 */
export function deepConvert(val: unknown): JSONValue | undefined {
  if (val === undefined) return undefined;
  if (val === null) return null;

  if (Array.isArray(val)) return val.map(deepConvert) as JSONValue[];

  if (typeof val === 'object') {
    const result: Record<string, JSONValue> = {};
    for (const key of Object.keys(val)) {
      const converted = deepConvert((val as Record<string, unknown>)[key]);
      if (converted !== undefined) result[key] = converted;
    }
    return result;
  }

  if (typeof val === 'string') {
    const str = val.trim();

    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;
    if (str !== '' && !isNaN(Number(str))) return Number(str);

    if (
      (str.startsWith('{') && str.endsWith('}')) ||
      (str.startsWith('[') && str.endsWith(']'))
    ) {
      try {
        return JSON.parse(str) as JSONValue;
      } catch {
        throw new BadRequestException(`Invalid JSON in query parameter: ${str}`);
      }
    }

    return str;
  }

  return val as JSONValue;
}
