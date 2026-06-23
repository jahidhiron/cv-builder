/**
 * Input parameters for {@link UpsertServerErrorProvider.execute}.
 *
 * All fields are derived from the caught exception and the active HTTP request
 * before being passed to the atomic PostgreSQL `INSERT … ON CONFLICT` upsert.
 */
export interface UpsertErrorParams {
  /** SHA-256 fingerprint of `errorName + message + topStackFrame` (64 hex chars). */
  fingerprint: string;
  /** Constructor name of the thrown exception (e.g. `"TypeError"`). */
  errorName: string;
  /** Exception message text. */
  message: string;
  /** HTTP verb of the failing request. */
  method: string;
  /** Request URL path. */
  path: string;
  /** Full stack trace string, or `null` when unavailable. */
  stack: string | null;
  /** Timestamp of the current occurrence — used for both `firstSeenAt` (INSERT) and `lastSeenAt` (UPDATE). */
  now: Date;
}
