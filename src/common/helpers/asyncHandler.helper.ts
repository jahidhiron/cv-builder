import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import {
  CannotCreateEntityIdMapError,
  EntityNotFoundError,
  EntityPropertyNotFoundError,
  QueryFailedError,
  TypeORMError,
} from 'typeorm';

/**
 * Safely executes a database operation with consistent error handling and logging.
 *
 * @template T - Return type of the database operation.
 * @param fn - Async database operation to execute.
 * @param errorResponse - Centralized error response service.
 * @param logger - Application logger instance.
 * @returns Promise<T> - Result or mapped error response.
 */
export async function handle<T>(
  fn: () => Promise<T>,
  errorResponse: ErrorResponse,
  logger: AppLogger,
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const context = 'DatabaseHandler';
    const error = err instanceof Error ? err : new Error(String(err));
    const message = error.message || 'Unknown database error';

    logger.error(`DB operation failed: ${message}`, error.stack, context);

    /** ── SQL / Query Errors ───────────────────────────── */
    if (err instanceof QueryFailedError) {
      const driverError = (
        err as QueryFailedError & {
          driverError?: { sqlMessage?: string; message?: string };
        }
      ).driverError;

      const sqlMessage: string =
        typeof driverError?.sqlMessage === 'string'
          ? driverError.sqlMessage
          : typeof driverError?.message === 'string'
            ? driverError.message
            : err.message;

      const normalized = sqlMessage.toLowerCase();

      /** ── SCHEMA CONFLICTS ───────────────────────────── */
      if (normalized.includes('duplicate column')) {
        return errorResponse.internalServerError({
          message:
            'Database schema conflict: a column with this name already exists. Please review your entity mappings or pending migrations.',
        });
      }

      /** ── DUPLICATE RECORD / UNIQUE KEY VIOLATION ───── */
      if (normalized.includes('duplicate entry') || normalized.includes('er_dup_entry')) {
        return errorResponse.conflict({
          message: 'Duplicate record detected. This entry already exists in the database.',
        });
      }

      /** ── INVALID COLUMN / FIELD ─────────────────────── */
      if (normalized.includes('unknown column')) {
        return errorResponse.internalServerError({
          message: 'Invalid database field referenced in query.',
        });
      }

      /** ── FOREIGN KEY CONFLICT ───────────────────────── */
      if (normalized.includes('foreign key')) {
        return errorResponse.conflict({
          message: 'Operation violates foreign key constraints.',
        });
      }

      /** ── DEFAULT SQL ERROR ──────────────────────────── */
      return errorResponse.internalServerError({
        message: 'Database query execution failed. Contact support.',
      });
    }

    /** ── ORM Mapping / Schema Errors ──────────────────── */
    if (
      err instanceof EntityNotFoundError ||
      err instanceof CannotCreateEntityIdMapError ||
      err instanceof EntityPropertyNotFoundError
    ) {
      return errorResponse.internalServerError({
        message: 'Database mapping or relation error occurred. Please verify entity relationships.',
      });
    }

    if (err instanceof TypeORMError) {
      return errorResponse.internalServerError({
        message: 'Unexpected ORM error during database operation.',
      });
    }

    /** ── Connection / Timeout / Deadlock ──────────────── */
    if (message.includes('ECONNREFUSED') || message.includes('timeout')) {
      return errorResponse.serviceUnavailable({
        message: 'Database connection issue. Try again later.',
      });
    }

    if (message.toLowerCase().includes('deadlock')) {
      return errorResponse.requestTimeout({
        message: 'Database deadlock detected. Please retry the operation.',
      });
    }

    /** ── Default Fallback ─────────────────────────────── */
    return errorResponse.internalServerError({
      message: 'Unexpected database error occurred.',
    });
  }
}
