/**
 * Minimal logger interface for use in standalone scripts.
 *
 * Decouples callers from `winston.Logger` so the return type is a stable,
 * self-contained interface — insulating consumers from any `winston` type
 * resolution differences between CLI and IDE TypeScript services.
 *
 * Implemented by {@link createScriptLogger} using the same Winston transports
 * as the application logger (`devFormat` console + `fileTransport` daily-rotating file).
 */
export interface ScriptLogger {
  /** Log at `info` level with optional structured metadata. */
  info(message: string, meta?: Record<string, unknown>): void;
  /** Log at `warn` level with optional structured metadata. */
  warn(message: string, meta?: Record<string, unknown>): void;
  /** Log at `error` level with optional structured metadata. */
  error(message: string, meta?: Record<string, unknown>): void;
}
