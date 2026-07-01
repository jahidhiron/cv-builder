import { AUTO_REDACT_FIELDS, SENSITIVE_METADATA_KEY } from '../constants';

/**
 * Marks a DTO or entity property as sensitive so `snapshot()` never writes
 * its value to the activity-log database.
 *
 * The field is replaced with `"[REDACTED]"` in both `input` and `output`
 * snapshots produced by `@SystemLog`.
 *
 * For plain objects and interfaces where class decorators cannot be applied,
 * use {@link AUTO_REDACT_FIELDS} as an automatic fallback instead.
 *   @Sensitive()
 *   password!: string;
 * }
 * ```
 *
 * @returns A `PropertyDecorator` that attaches `SENSITIVE_METADATA_KEY`
 *          metadata to the decorated property via `Reflect`.
 */
export function Sensitive(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    Reflect.defineMetadata(SENSITIVE_METADATA_KEY, true, target, propertyKey);
  };
}

/**
 * Determines whether a property on an object should be redacted in log snapshots.
 *
 * Resolution order:
 *   1. {@link AUTO_REDACT_FIELDS} — matches by field name alone, works on plain objects.
 *   2. `@Sensitive()` Reflect metadata — requires a class instance with a prototype.
 *
 * @param parent - The object that owns the property (used to read its prototype chain).
 * @param key - The property name to check.
 * @returns `true` if the field should be replaced with `"[REDACTED]"`, `false` otherwise.
 */
export function isSensitiveField(parent: object, key: string): boolean {
  if (AUTO_REDACT_FIELDS.has(key)) return true;
  try {
    const proto = Object.getPrototypeOf(parent) as object | null;
    return proto !== null && Reflect.getMetadata(SENSITIVE_METADATA_KEY, proto, key) === true;
  } catch {
    return false;
  }
}
