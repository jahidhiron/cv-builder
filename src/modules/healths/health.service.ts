import {
  DbHealthResponseDto,
  QueueListResponseDto,
  QueueStatsQueryDto,
  QueueStatsResponseDto,
} from '@/modules/healths/dtos';
import {
  DbHealthProvider,
  QueueListProvider,
  QueueStatsProvider,
} from '@/modules/healths/providers';
import { Injectable } from '@nestjs/common';

/**
 * Facade service for the health-check domain.
 *
 * Exposes database and RabbitMQ diagnostic operations consumed by {@link HealthController}.
 * Delegates all infrastructure queries to dedicated providers rather than querying directly.
 *
 * @module Health
 */
@Injectable()
export class HealthService {
  /**
   * @param dbHealthPro - Provider for comprehensive database health checks.
   * @param queueStatsPro - Provider for single-queue RabbitMQ statistics.
   * @param queueListPro - Provider for listing all RabbitMQ queues with metrics.
   */
  constructor(
    private readonly dbHealthPro: DbHealthProvider,
    private readonly queueStatsPro: QueueStatsProvider,
    private readonly queueListPro: QueueListProvider,
  ) {}

  /**
   * Returns a full database health snapshot including latency, version, uptime,
   * active connections, QPS, and connection pool limits.
   *
   * @returns A {@link DbHealthResponseDto} on success, or an error response on failure.
   */
  dbHealth(): Promise<DbHealthResponseDto> {
    return this.dbHealthPro.execute();
  }

  /**
   * Returns stats for a single RabbitMQ queue identified by the query.
   *
   * @param query - DTO containing an optional queue name; falls back to the configured default.
   * @returns A {@link QueueStatsResponseDto} on success, or an error response on failure.
   */
  queueStats(query: QueueStatsQueryDto): Promise<QueueStatsResponseDto> {
    return this.queueStatsPro.execute(query);
  }

  /**
   * Returns stats for all registered RabbitMQ queues.
   *
   * @returns A {@link QueueListResponseDto} on success, or an error response on failure.
   */
  queueList(): Promise<QueueListResponseDto> {
    return this.queueListPro.execute();
  }
}
