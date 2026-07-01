import { ModuleName } from '@/common/base/enums';
import { AppLogger } from '@/config/logger';
import { SystemLog } from '@/modules/activity-log/decorators';
import {
  DbErrorDto,
  DbHealthDto,
  DbHealthResponseDto,
  PostgresConnectionStatsDto,
} from '@/modules/healths/dtos';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Provider for a comprehensive PostgreSQL health check.
 *
 * Collects latency, server version, uptime, queries-per-second, active connections,
 * and connection pool limits in a single pass and returns them as a {@link DbHealthResponseDto}.
 *
 * @module Health
 */
@Injectable()
export class DbHealthProvider {
  /**
   * @param dataSource - Active TypeORM DataSource used to run diagnostic queries.
   * @param logger - Application logger used to record failures.
   * @param errorResponse - Shared utility for building standardised error responses.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Runs all diagnostic queries against the database and returns a full health snapshot.
   *
   * Collects: ping latency, server version, uptime (seconds since postmaster start),
   * active connection count, queries-per-second (derived from `pg_stat_database`),
   * and connection pool limits via {@link getPostgresConnectionStats}.
   *
   * Returns a 500 error response if the initial ping fails.
   *
   * @returns A {@link DbHealthResponseDto} on success, or a 500 error response on failure.
   */
  @SystemLog(ModuleName.Health)
  async execute(): Promise<DbHealthResponseDto> {
    const result: DbHealthDto = {
      service: 'UP',
      database: 'UNKNOWN',
      dbLatencyMs: -1,
      timestamp: new Date(),
    };

    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const end = Date.now();
      result.database = 'UP';
      result.dbLatencyMs = end - start;

      const versionResult = await this.dataSource.query<{ version: string }[]>(
        'SELECT version()',
      );
      result.dbVersion = versionResult[0]?.version;

      const uptimeResult = await this.dataSource.query<{
        seconds: number;
      }[]>(
        "SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))::int AS seconds",
      );
      const uptimeSec = uptimeResult[0]?.seconds ?? 1;
      result.dbUptimeSeconds = uptimeSec;

      const connectionsResult = await this.dataSource.query<{ count: string }[]>(
        'SELECT count(*)::int AS count FROM pg_stat_activity',
      );
      const totalConnections = connectionsResult[0]?.count
        ? parseInt(connectionsResult[0].count, 10)
        : 0;
      result.threadsRunning = totalConnections;

      const statsResult = await this.dataSource.query<{
        xact_commit: string;
        xact_rollback: string;
      }[]>(
        "SELECT xact_commit, xact_rollback FROM pg_stat_database WHERE datname = current_database()",
      );
      if (statsResult.length) {
        const totalTx =
          parseInt(statsResult[0].xact_commit, 10) +
          parseInt(statsResult[0].xact_rollback, 10);
        result.queriesPerSecond = parseFloat((totalTx / uptimeSec).toFixed(2));
      }

      result.postgresConnections = await this.getPostgresConnectionStats();
    } catch (err: unknown) {
      result.database = 'DOWN';
      const dbError: DbErrorDto = {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      };
      result.dbError = dbError;
      this.logger.error('Database health check failed: ' + dbError.message, dbError.stack);
      return this.errorResponse.internalServerError();
    }

    return { dbHealth: result };
  }

  /**
   * Queries PostgreSQL system views for current, max-used, and max-allowed connection counts.
   *
   * @returns A {@link PostgresConnectionStatsDto} on success, or `undefined` if the query fails.
   */
  private async getPostgresConnectionStats(): Promise<PostgresConnectionStatsDto | undefined> {
    try {
      const current = await this.dataSource.query<{ count: string }[]>(
        'SELECT count(*)::int AS count FROM pg_stat_activity',
      );
      const maxUsed = await this.dataSource.query<{ conn: string }[]>(
        "SELECT numbackends::int AS conn FROM pg_stat_database WHERE datname = current_database()",
      );
      const maxAllowed = await this.dataSource.query<{ setting: string }[]>('SHOW max_connections');

      return {
        current: current.length ? parseInt(current[0].count, 10) : 0,
        maxUsed: maxUsed.length ? parseInt(maxUsed[0].conn, 10) : 0,
        maxAllowed: maxAllowed.length ? parseInt(maxAllowed[0].setting, 10) : 100,
      };
    } catch (err: unknown) {
      this.logger.error(
        'Failed to fetch PostgreSQL connection stats',
        err instanceof Error ? err.stack : String(err),
      );
      return undefined;
    }
  }
}
