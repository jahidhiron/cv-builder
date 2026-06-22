import type { ClientConfig } from 'pg';

/**
 * Resolved connection configuration returned by `buildClientConfig`.
 *
 * The `config` always targets the maintenance `postgres` database so that
 * the initial connection succeeds before the application database exists.
 * `dbName` is the application database name to create or verify.
 */
export interface ClientConfigResult {
  /** `pg.Client` connection options pointing at the maintenance `postgres` database. */
  config: ClientConfig;
  /** Name of the application database to create (extracted from the env config). */
  dbName: string;
}
