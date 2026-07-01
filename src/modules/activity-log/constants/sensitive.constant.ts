/** Reflect metadata key used by {@link Sensitive} to mark a property for redaction. */
export const SENSITIVE_METADATA_KEY = 'log:sensitive';

/**
 * Field names that are always redacted in activity-log snapshots, even when
 * the containing object is a plain interface or literal (where `@Sensitive()`
 * cannot be applied as a class decorator).
 *
 * Extend this set in the constants file if additional field names need
 * automatic redaction across the codebase.
 */
export const AUTO_REDACT_FIELDS = new Set<string>(['password', 'passwordHash']);
