import { ValidationError } from '@/common/pipes/interfaces';

/**
 * Converts a camelCase or dot-separated field path into a human-readable label.
 *
 * @example `"firstName"` → `"First name"`, `"address.zipCode"` → `"Address zip code"`
 * @param field - Raw field path from the validation error.
 * @returns Sentence-cased, space-separated label.
 */
export function prettifyFieldName(field: string): string {
  const spaced = field
    .replace(/([A-Z])/g, ' $1')
    .replace(/\./g, ' ')
    .toLowerCase()
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Priority order for constraint names when a field has multiple validation errors.
 *
 * Lower number = shown first. Without this, `Object.values(constraints)` returns
 * keys in insertion order (which follows decorator application order: bottom-to-top
 * in TypeScript), causing `maxLength` to surface before `isNotEmpty` or `minLength`
 * on empty/short values.
 */
const CONSTRAINT_PRIORITY: Record<string, number> = {
  isDefined: 0,
  isNotEmpty: 1,
  isString: 2,
  isNumber: 2,
  isBoolean: 2,
  isArray: 2,
  isObject: 2,
  isDate: 2,
  isEnum: 2,
  isEmail: 2,
  isUrl: 2,
  isUuid: 2,
  isInt: 2,
  minLength: 3,
  isLength: 3,
  min: 3,
  maxLength: 4,
  max: 4,
};

/**
 * Flattens a tree of class-validator `ValidationError` objects into a flat list of
 * `{ field, message }` pairs suitable for an API error response.
 *
 * Only the most relevant constraint message per field is kept (see
 * {@link CONSTRAINT_PRIORITY}). Nested errors are processed recursively with
 * dot-separated paths.
 *
 * @param errors     - Top-level validation errors from class-validator.
 * @param parentPath - Dot-separated ancestor path (populated during recursion).
 * @returns Flat array of field + human-readable message pairs.
 */
export function extractValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): { field: string; message: string }[] {
  return errors.flatMap((error) => {
    const propertyPath = parentPath ? `${parentPath}.${error.property}` : (error.property ?? '');

    const constraints: { field: string; message: string }[] = [];
    if (error.constraints) {
      const prettyField = prettifyFieldName(propertyPath);
      const firstMessage = Object.entries(error.constraints)
        .sort(([a], [b]) => (CONSTRAINT_PRIORITY[a] ?? 99) - (CONSTRAINT_PRIORITY[b] ?? 99))
        .find(([, msg]) => typeof msg === 'string')?.[1];

      if (firstMessage) {
        const escapedProperty = error.property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const message = firstMessage.replace(new RegExp(escapedProperty, 'g'), prettyField);
        constraints.push({ field: propertyPath, message });
      }
    }

    const children = error.children?.length
      ? extractValidationErrors(error.children, propertyPath)
      : [];

    return [...constraints, ...children];
  });
}
