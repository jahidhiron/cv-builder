import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import {
  CannotCreateEntityIdMapError,
  EntityNotFoundError,
  EntityPropertyNotFoundError,
  QueryFailedError,
  TypeORMError,
} from 'typeorm';
import { PgDriverError } from './types';

/** PostgreSQL SQLSTATE codes used for precise error classification. */
const PG = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  INTEGRITY_CONSTRAINT: '23000',
  UNDEFINED_COLUMN: '42703',
  UNDEFINED_TABLE: '42P01',
  UNDEFINED_FUNCTION: '42883',
  SYNTAX_ERROR: '42601',
  DEADLOCK_DETECTED: '40P01',
  SERIALIZATION_FAILURE: '40001',
  CONNECTION_EXCEPTION: '08000',
  CONNECTION_DOES_NOT_EXIST: '08003',
  CONNECTION_FAILURE: '08006',
  QUERY_CANCELED: '57014',
  TOO_MANY_CONNECTIONS: '53300',
  STRING_TOO_LONG: '22001',
  NUMERIC_OUT_OF_RANGE: '22003',
  INVALID_TEXT_REPRESENTATION: '22P02',
} as const;

/** Extracts the driver-level error attached to a `QueryFailedError`. */
function driverError(err: QueryFailedError<Error>): PgDriverError {
  return (err as QueryFailedError<Error> & { driverError?: PgDriverError }).driverError ?? {};
}

/**
 * Safely executes a database operation with consistent error handling and logging.
 *
 * Detection priority:
 * 1. PostgreSQL SQLSTATE code (reliable, driver-level)
 * 2. MySQL / generic SQL message strings (fallback for non-pg drivers)
 * 3. TypeORM ORM-level errors
 * 4. Connection / timeout string heuristics
 *
 * @template T - Return type of the database operation.
 * @param fn           - Async database operation to execute.
 * @param errorResponse - Centralised error response service.
 * @param logger       - Application logger instance.
 * @returns Promise resolving to `T`, or throws a mapped `HttpException`.
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

    /* ── QueryFailedError (SQL execution errors) ───────────────────────── */
    if (err instanceof QueryFailedError) {
      const driver = driverError(err as QueryFailedError<Error>);
      const code = driver.code ?? '';
      const sqlMsg = (driver.sqlMessage ?? driver.message ?? err.message).toLowerCase();

      /* UNIQUE VIOLATION ── 23505 or MySQL duplicate entry */
      if (
        code === PG.UNIQUE_VIOLATION ||
        sqlMsg.includes('duplicate entry') ||
        sqlMsg.includes('er_dup_entry') ||
        sqlMsg.includes('unique constraint')
      ) {
        return errorResponse.conflict({
          message: 'A record with these details already exists.',
        });
      }

      /* FOREIGN KEY VIOLATION ── 23503 */
      if (code === PG.FOREIGN_KEY_VIOLATION || sqlMsg.includes('foreign key')) {
        return errorResponse.conflict({
          message: 'Operation violates a foreign key constraint.',
        });
      }

      /* NOT NULL VIOLATION ── 23502 */
      if (code === PG.NOT_NULL_VIOLATION || sqlMsg.includes('not null')) {
        return errorResponse.unprocessableEntity({
          message: 'A required field is missing or null.',
        });
      }

      /* CHECK CONSTRAINT VIOLATION ── 23514 */
      if (code === PG.CHECK_VIOLATION || sqlMsg.includes('check constraint')) {
        return errorResponse.unprocessableEntity({
          message: 'A value failed a database check constraint.',
        });
      }

      /* GENERAL INTEGRITY CONSTRAINT ── 23000 */
      if (code === PG.INTEGRITY_CONSTRAINT) {
        return errorResponse.conflict({
          message: 'Operation violates a database integrity constraint.',
        });
      }

      /* DEADLOCK ── 40P01 */
      if (code === PG.DEADLOCK_DETECTED || sqlMsg.includes('deadlock')) {
        return errorResponse.requestTimeout({
          message: 'A database deadlock was detected. Please retry the operation.',
        });
      }

      /* SERIALIZATION FAILURE ── 40001 (retryable transaction conflict) */
      if (code === PG.SERIALIZATION_FAILURE || sqlMsg.includes('serialization')) {
        return errorResponse.requestTimeout({
          message: 'Transaction conflict detected. Please retry the operation.',
        });
      }

      /* QUERY CANCELED / STATEMENT TIMEOUT ── 57014 */
      if (code === PG.QUERY_CANCELED || sqlMsg.includes('statement timeout')) {
        return errorResponse.requestTimeout({
          message: 'The database query was canceled due to a timeout.',
        });
      }

      /* TOO MANY CONNECTIONS ── 53300 */
      if (code === PG.TOO_MANY_CONNECTIONS || sqlMsg.includes('too many connections')) {
        return errorResponse.serviceUnavailable({
          message: 'Database connection pool is exhausted. Please try again shortly.',
        });
      }

      /* CONNECTION ERRORS ── 08xxx */
      if (
        (
          [PG.CONNECTION_EXCEPTION, PG.CONNECTION_DOES_NOT_EXIST, PG.CONNECTION_FAILURE] as string[]
        ).includes(code) ||
        sqlMsg.includes('econnrefused') ||
        sqlMsg.includes('connection refused') ||
        sqlMsg.includes('connection terminated')
      ) {
        return errorResponse.serviceUnavailable({
          message: 'Unable to reach the database. Please try again later.',
        });
      }

      /* DATA TOO LONG ── 22001 */
      if (code === PG.STRING_TOO_LONG || sqlMsg.includes('value too long')) {
        return errorResponse.unprocessableEntity({
          message: 'A field value exceeds the maximum allowed length.',
        });
      }

      /* NUMERIC OUT OF RANGE ── 22003 */
      if (code === PG.NUMERIC_OUT_OF_RANGE || sqlMsg.includes('out of range')) {
        return errorResponse.unprocessableEntity({
          message: 'A numeric value is out of the allowed range.',
        });
      }

      /* INVALID TEXT REPRESENTATION ── 22P02 (bad UUID, invalid cast, etc.) */
      if (code === PG.INVALID_TEXT_REPRESENTATION || sqlMsg.includes('invalid input syntax')) {
        return errorResponse.unprocessableEntity({
          message: 'A field contains a value in an invalid format.',
        });
      }

      /* SCHEMA ERRORS ── undefined column / table / function / syntax */
      if (
        (
          [
            PG.UNDEFINED_COLUMN,
            PG.UNDEFINED_TABLE,
            PG.UNDEFINED_FUNCTION,
            PG.SYNTAX_ERROR,
          ] as string[]
        ).includes(code) ||
        sqlMsg.includes('unknown column') ||
        sqlMsg.includes('duplicate column')
      ) {
        return errorResponse.internalServerError({
          message: 'A database schema error occurred. Please contact support.',
        });
      }

      /* DEFAULT SQL FALLBACK */
      return errorResponse.internalServerError({
        message: 'A database query error occurred. Please contact support.',
      });
    }

    /* ── ORM Mapping / Entity Errors ───────────────────────────────────── */
    if (
      err instanceof EntityNotFoundError ||
      err instanceof CannotCreateEntityIdMapError ||
      err instanceof EntityPropertyNotFoundError
    ) {
      return errorResponse.internalServerError({
        message: 'A database mapping error occurred. Please verify entity relationships.',
      });
    }

    if (err instanceof TypeORMError) {
      return errorResponse.internalServerError({
        message: 'An unexpected ORM error occurred during the database operation.',
      });
    }

    /* ── Connection / Timeout heuristics (non-QueryFailedError path) ───── */
    const lmsg = message.toLowerCase();

    if (
      lmsg.includes('econnrefused') ||
      lmsg.includes('connection refused') ||
      lmsg.includes('connection terminated') ||
      lmsg.includes('econnreset') ||
      lmsg.includes('epipe')
    ) {
      return errorResponse.serviceUnavailable({
        message: 'Database connection issue. Please try again later.',
      });
    }

    if (lmsg.includes('timeout') || lmsg.includes('timed out')) {
      return errorResponse.requestTimeout({
        message: 'The database operation timed out. Please retry.',
      });
    }

    if (lmsg.includes('deadlock')) {
      return errorResponse.requestTimeout({
        message: 'A database deadlock was detected. Please retry the operation.',
      });
    }

    /* ── Default Fallback ───────────────────────────────────────────────── */
    return errorResponse.internalServerError({
      message: 'An unexpected database error occurred.',
    });
  }
}
