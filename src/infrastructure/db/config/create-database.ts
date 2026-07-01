/**
 * Pre-migration script — run this before `migration:run`.
 *
 * Connects to the PostgreSQL maintenance `postgres` database (not the app DB)
 * and creates the target database when it does not already exist.
 * This must run outside TypeORM because migrations require an existing
 * connection to the target database before they can execute.
 *
 * Usage: `pnpm db:create`
 */
import { createScriptLogger } from '@/config/logger';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { buildClientConfig } from './build-client-config.util';

loadEnv({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
loadEnv(); // fall back to .env

const logger = createScriptLogger('CreateDatabase');

/**
 * Connects to the PostgreSQL maintenance database and creates the app database if absent.
 *
 * @returns Promise that resolves when the database exists or has been created
 * @throws If the  statement fails or the maintenance connection cannot be established
 */
async function createDatabase(): Promise<void> {
  const { config, dbName } = buildClientConfig();
  const client = new Client(config);

  await client.connect();

  try {
    const result = await client.query<Record<string, unknown>>(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (!result.rowCount) {
      // Identifiers cannot be parameterised in DDL; dbName comes from a trusted env variable.
      try {
        await client.query(`CREATE DATABASE "${dbName}"`);
        logger.info(`Database "${dbName}" created.`);
      } catch (createErr: unknown) {
        logger.error(`Failed to execute CREATE DATABASE "${dbName}"`, {
          error: createErr instanceof Error ? createErr.message : String(createErr),
        });
        throw createErr;
      }
    } else {
      logger.info(`Database "${dbName}" already exists — skipping.`);
    }
  } finally {
    await client.end();
  }
}

createDatabase().catch((err: unknown) => {
  logger.error('Failed to create database', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});
