import { AppLogger } from '@/config/logger';
import {
  DbHealthStatusDto,
  DbHealthStatusResponseDto,
  PostgresConnectionStatsDto,
} from '@/modules/healths/dtos';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * @description Provides a lightweight PostgreSQL health snapshot (latency + connections).
 * @category Providers
 */
@Injectable()
export class DbHealthStatusProvider {
  /**
   * @param dataSource - Active TypeORM DataSource for running diagnostic queries.
   * @param logger - AppLogger used to capture query failures.
   * @param errorResponse - Service to handle errors.
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * @description Returns a compact DB health snapshot for liveness/readiness checks.
   * @returns The current database health status.
   */
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

  private async getPostgresConnectionStats(): Promise<PostgresConnectionStatsDto | null> {
    try {
      // Define the expected result type for each query
      const [currentConnections, maxAllowed] = await Promise.all([
        this.dataSource.query<{ count: string }[]>(
          'SELECT count(*)::int AS count FROM pg_stat_activity',
        ),
        this.dataSource.query<{ setting: string }[]>('SHOW max_connections'),
      ]);

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
