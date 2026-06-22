import { ClientConfigResult } from '@/infrastructure/db/interfaces';

/**
 * Derives a `pg.Client` config and target database name from environment variables.
 *
 * Supports two connection modes — the same two modes supported by `typeorm.config.ts`:
 *
 * - **URL mode** — `DATABASE_URL` is set. The host and credentials are parsed from the
 *   URL; the pathname (target DB) is replaced with `/postgres` so the initial connection
 *   lands on the maintenance database instead of the not-yet-existing app database.
 * - **Field mode** — Individual `PG_*` variables are used (`PG_HOST`, `PG_PORT`,
 *   `PG_USERNAME`, `PG_PASSWORD`, `PG_DATABASE`). Falls back to sane localhost defaults
 *   when a variable is absent.
 *
 * @returns The resolved `ClientConfig` for the maintenance connection and the `dbName`
 *          to create or verify.
 */
export function buildClientConfig(): ClientConfigResult {
  const url = process.env.DATABASE_URL;

  if (url) {
    const parsed = new URL(url);
    const dbName = parsed.pathname.replace(/^\//, '') || 'cv_builder';

    // Substitute the target DB with the maintenance DB for the initial connection.
    parsed.pathname = '/postgres';

    return { config: { connectionString: parsed.toString() }, dbName };
  }

  const dbName = process.env.PG_DATABASE ?? 'cv_builder';

  return {
    config: {
      host: process.env.PG_HOST ?? 'localhost',
      port: parseInt(process.env.PG_PORT ?? '5432', 10),
      user: process.env.PG_USERNAME ?? 'postgres',
      password: process.env.PG_PASSWORD ?? '',
      database: 'postgres',
    },
    dbName,
  };
}
