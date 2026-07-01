import { ModuleName } from '@/common/base/enums';
import { AppLogger } from '@/config/logger';
import { SystemLog } from '@/modules/activity-log/decorators';
import {
  DbHealthStatusDto,
  DbHealthStatusResponseDto,
  PostgresConnectionStatsDto,
} from '@/modules/healths/dtos';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Provides a lightweight PostgreSQL health snapshot covering latency and connection counts.
 *
 * @module Health
 */
@Injectable()
export class DbHealthStatusProvider {
  /**
   * @param dataSource - Active TypeORM DataSource used to run diagnostic queries.
   * @param logger - Application logger used to capture query failures.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Executes a liveness probe against the database and returns a compact health snapshot.
   *
   * Runs `SELECT 1` to measure latency, then queries `pg_stat_activity` and
   * `max_connections` for connection pool metrics. If the probe fails, the snapshot
   * reflects a `DOWN` state with the error message attached.
   *
   * @returns A {@link DbHealthStatusResponseDto} containing status, latency, and connection stats.
   */
  @SystemLog(ModuleName.Health)
  async execute(): Promise<DbHealthStatusResponseDto> {
    const result: DbHealthStatusDto = {
      service: 'UP',
      database: 'UNKNOWN',
      db_latency_ms: -1,
      timestamp: new Date(),
    };

    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const end = Date.now();

      result.database = 'UP';
      result.db_latency_ms = end - start;

      const connectionStats = await this.getPostgresConnectionStats();
      if (connectionStats) {
        result.postgresConnections = connectionStats;
      }
    } catch (err: unknown) {
      result.database = 'DOWN';
      result.error = err instanceof Error ? err.message : 'Unknown error';
    }

    return { dbHealthStatus: result };
  }

  /**
   * Queries PostgreSQL system views for current and maximum connection counts.
   *
   * @returns A {@link PostgresConnectionStatsDto} on success, or `null` if the query fails.
   */
  private async getPostgresConnectionStats(): Promise<PostgresConnectionStatsDto | null> {
    try {
      const currentConnections = await this.dataSource.query<{ count: string }[]>(
        'SELECT count(*)::int AS count FROM pg_stat_activity',
      );
      const maxAllowed = await this.dataSource.query<{ setting: string }[]>('SHOW max_connections');

      return {
        current: parseInt(currentConnections[0]?.count || '0', 10),
        maxUsed: 0, // pg_stat_reset provides maxUsed; left as 0 for the lightweight snapshot
        maxAllowed: parseInt(maxAllowed[0]?.setting || '100', 10),
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error('Failed to fetch PostgreSQL connection stats', err.stack);
      } else {
        this.logger.error('Failed to fetch PostgreSQL connection stats: ' + String(err));
      }
      return null;
    }
  }
}
