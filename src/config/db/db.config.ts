import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  type: 'postgres' as const,
  url: process.env.DATABASE_URL || undefined,
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  username: process.env.PG_USERNAME || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DATABASE || 'app_db',
  migrationsRun: process.env.MIGRATIONS_RUN === 'true',
  retryAttempts: process.env.DB_RETRY_ATTEMPTS ? parseInt(process.env.DB_RETRY_ATTEMPTS, 10) : 5,
  retryDelay: process.env.DB_RETRY_DELAY ? parseInt(process.env.DB_RETRY_DELAY, 10) : 3000,
}));
