/**
 * Lifecycle states for a tracked {@link ServerError} record.
 *
 * Administrators transition errors through these states during triage.
 * The upsert logic uses the state to decide whether a first-occurrence
 * email alert should be suppressed on repeated occurrences.
 */
export enum ServerErrorStatus {
  /** Newly detected; not yet reviewed by an administrator. */
  Pending = 'pending',
  /** An administrator is actively investigating this error. */
  InProgress = 'in_progress',
  /** Error has been diagnosed and a fix has been deployed. */
  Resolved = 'resolved',
  /** Acknowledged but deliberately left unfixed (e.g. known third-party issue). */
  WontFix = 'wont_fix',
  /** Suppressed — repeated occurrences are counted but no further alerts are sent. */
  Ignored = 'ignored',
  /** Identified as a duplicate of another tracked error. */
  Duplicate = 'duplicate',
}
