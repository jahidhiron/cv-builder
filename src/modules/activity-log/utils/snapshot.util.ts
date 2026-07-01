import { isSensitiveField } from '../decorators';

/**
 * Produces a JSON-safe snapshot of an arbitrary value for activity-log storage.
 *
 * Handles the following types during serialisation:
 * - **Sensitive fields** — replaced with `"[REDACTED]"` when matched by
 *   {@link isSensitiveField} (either via `@Sensitive()` metadata or `AUTO_REDACT_FIELDS`).
 * - **`BigInt`** — converted to string via `.toString()`.
 * - **`Function` / `Symbol`** — omitted (`undefined` in `JSON.stringify` context).
 * - **`Date`** — serialised as ISO 8601 string via `.toISOString()`.
 * - **`Error`** — reduced to `{ name, message }` to avoid losing the message in serialisation.
 * - **Circular references** — replaced with `"[Circular]"`.
 * - **Large arrays** (> 5 items) — collapsed to `{ _arrayLength, _firstItem }` to cap payload size.
 * - **Primitives** — wrapped in `{ value }` so the return type is always an object or `null`.
 *
 * @param value - Any value to snapshot (object, array, primitive, `null`, `undefined`).
 * @returns A plain `Record<string, unknown>` safe for JSON storage, or `null` if
 *          the value is `null`, `undefined`, or cannot be serialised.
 */
export function snapshot(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  const seen = new WeakSet<object>();
  try {
    const json = JSON.stringify(
      value,
      function (this: unknown, key: string, v: unknown): unknown {
        if (key !== '' && this !== null && typeof this === 'object') {
          if (isSensitiveField(this, key)) return '[REDACTED]';
        }
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'function' || typeof v === 'symbol') return undefined;
        if (v instanceof Date) return v.toISOString();
        if (v instanceof Error) return { name: v.name, message: v.message };
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        return v;
      },
      0,
    );
    if (json === undefined) return null;
    const parsed = JSON.parse(json) as unknown;
    if (parsed === null || typeof parsed !== 'object') return { value: parsed };
    if (Array.isArray(parsed) && parsed.length > 5) {
      return { _arrayLength: parsed.length, _firstItem: parsed[0] };
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
