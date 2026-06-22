import { AppLogger } from '@/config/logger';
import {
  DbErrorDto,
  DbHealthDto,
  DbHealthResponseDto,
  PostgresConnectionStatsDto,
} from '@/modules/healths/dtos';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DbHealthProvider {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Check database health, latency, version, uptime, QPS, and connection stats
   * @returns Database health DTO or error response
   */
  async execute(): Promise<DbHealthResponseDto> {
    const result: DbHealthDto = {
      service: 'UP',
      database: 'UNKNOWN',
      dbLatencyMs: -1,
      timestamp: new Date(),
    };

    try {
      // Ping database and measure latency
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const end = Date.now();
      result.database = 'UP';
      result.dbLatencyMs = end - start;

      // Fetch PostgreSQL version
      const versionResult = await this.dataSource.query<{ version: string }[]>(
        'SELECT version()',
      );
      result.dbVersion = versionResult[0]?.version;

      // Fetch database uptime (seconds since postmaster start)
      const uptimeResult = await this.dataSource.query<{
        seconds: number;
      }[]>(
        "SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))::int AS seconds",
      );
      const uptimeSec = uptimeResult[0]?.seconds ?? 1;
      result.dbUptimeSeconds = uptimeSec;

      // Fetch number of active connections
      const connectionsResult = await this.dataSource.query<{ count: string }[]>(
        'SELECT count(*)::int AS count FROM pg_stat_activity',
      );
      const totalConnections = connectionsResult[0]?.count
        ? parseInt(connectionsResult[0].count, 10)
        : 0;
      result.threadsRunning = totalConnections;

      // Calculate queries per second (QPS) from pg_stat_database stats
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

      // Fetch PostgreSQL connection stats
      result.postgresConnections = await this.getPostgresConnectionStats();
    } catch (err: unknown) {
      // Handle errors and log
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
   * Get PostgreSQL connection stats: current, max used since reset, and max allowed
   * @returns PostgresConnectionStatsDto or undefined if query fails
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
