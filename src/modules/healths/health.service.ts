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

@Injectable()
export class HealthService {
  constructor(
    private readonly dbHealthPro: DbHealthProvider,
    private readonly queueStatsPro: QueueStatsProvider,
    private readonly queueListPro: QueueListProvider,
  ) {}

  /**
   * Get current database health status.
   * @returns Database health including latency, uptime, threads, and connection stats.
   */
  dbHealth(): Promise<DbHealthResponseDto> {
    return this.dbHealthPro.execute();
  }

  /**
   * Get statistics for a specific RabbitMQ queue.
   * @param query Queue name query.
   * @returns Queue stats including messages, consumers, memory, throughput, and configuration.
   */
  queueStats(query: QueueStatsQueryDto): Promise<QueueStatsResponseDto> {
    return this.queueStatsPro.execute(query);
  }

  /**
   * Get statistics for all RabbitMQ queues.
   * @returns List of queues with their stats including messages, consumers, memory, throughput, and configuration.
   */
  queueList(): Promise<QueueListResponseDto> {
    return this.queueListPro.execute();
  }
}
