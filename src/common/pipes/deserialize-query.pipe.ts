import { Injectable, PipeTransform } from '@nestjs/common';
import { JSONValue } from './types';
import { deepConvert } from './deserialize-query.utils';

/**
 * Global pipe that deeply converts all query-parameter values from their raw string
 * representations to proper TypeScript primitives.
 *
 * NestJS pipes receive already-parsed query objects from Express, so this pipe
 * walks the object tree and calls {@link deepConvert} on every leaf value. Numeric
 * strings, boolean strings, and JSON strings are all coerced to their correct types
 * so that downstream DTOs can use typed `@IsNumber()` / `@IsBoolean()` validators
 * without manual transformation.
 *
 * Applied globally via `app.useGlobalPipes(new DeserializeQuery())` in `app.ts`.
 */
@Injectable()
export class DeserializeQuery implements PipeTransform {
  /**
   * @param value - The raw query-parameter object produced by Express.
   * @returns The same object with all leaf values converted to typed primitives.
   */
  transform(value: unknown): unknown {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

    const result: Record<string, JSONValue> = {};
    for (const key of Object.keys(value)) {
      const converted = deepConvert((value as Record<string, unknown>)[key]);
      if (converted !== undefined) result[key] = converted;
    }
    return result;
  }
}
