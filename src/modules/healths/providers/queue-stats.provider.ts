import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { SystemLog } from '@/modules/activity-log/decorators';
import { QueueDto, QueueStatsQueryDto, QueueStatsResponseDto } from '@/modules/healths/dtos';
import { RabbitMqQueueApiResponse } from '@/modules/healths/providers/interfaces';
import { HttpClientService } from '@/shared/http-client';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

/**
 * Provider that fetches stats for a single RabbitMQ queue from the management API
 * and returns them as an enriched {@link QueueDto}.
 *
 * Falls back to the `RABBITMQ_QUEUE` config value when no queue name is supplied in the query.
 *
 * @module Health
 */
@Injectable()
export class QueueStatsProvider {
  /**
   * @param logger - Application logger used to record fetch failures.
   * @param configService - Configuration source for RabbitMQ connection details.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param httpClient - HTTP client used to call the RabbitMQ management API.
   */
  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
    private readonly errorResponse: ErrorResponse,
    private readonly httpClient: HttpClientService,
  ) {}

  /**
   * Converts a RabbitMQ `idle_since` ISO timestamp to elapsed seconds.
   *
   * @param idleSince - ISO 8601 date string from the RabbitMQ API, or `undefined` if the queue is active.
   * @returns Seconds elapsed since the queue last received a message, or `undefined` if not idle.
   */
  private idleSinceSeconds(idleSince?: string): number | undefined {
    if (!idleSince) return undefined;
    return Math.floor((Date.now() - new Date(idleSince).getTime()) / 1000);
  }

  /**
   * Fetches stats for a single queue from the RabbitMQ management API.
   *
   * The target queue is taken from `query.queue`, falling back to the configured
   * `RABBITMQ_QUEUE` value. Returns a 404 when the queue is not found and a 500
   * on unexpected errors.
   *
   * @param query - DTO containing an optional queue name to look up.
   * @returns A {@link QueueStatsResponseDto} on success, or an error response on failure.
   */
  @SystemLog(ModuleName.Health)
  async execute(query: QueueStatsQueryDto): Promise<QueueStatsResponseDto> {
    const { apiURI, username, password, rabbitmqQueue } = this.configService.rabbitmq;
    const queue = query.queue || rabbitmqQueue;
    const url = `${apiURI}/queues/%2f/${queue}`;

    try {
      const response = await firstValueFrom(
        this.httpClient.get<RabbitMqQueueApiResponse>(url, {
          auth: { username, password },
        }),
      );

      const data = response?.data;
      if (!data) {
        return this.errorResponse.notFound({
          module: ModuleName.Health,
          key: 'queue-stats-not-found',
        });
      }

      const stats = data.message_stats ?? {};
      const args = data.arguments ?? {};

      const queueStats: QueueDto = {
        queue: data.name,
        messages: data.messages,
        ready: data.messages_ready,
        unacked: data.messages_unacknowledged,
        consumers: data.consumers,
        publishRatePerSec: stats.publish_details?.rate,
        deliverGetRatePerSec: stats.deliver_get_details?.rate,
        ackRatePerSec: stats.ack_details?.rate,
        memoryBytes: data.memory,
        durable: data.durable,
        exclusive: data.exclusive,
        idleSinceSeconds: this.idleSinceSeconds(data.idle_since),
        type: data.type,
        deadLetterExchange: args['x-dead-letter-exchange'],
        deadLetterRoutingKey: args['x-dead-letter-routing-key'],
        timestamp: new Date(),
      };

      return { queueStats };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;

      this.logger.error(`Queue stats check failed: ${message}`, stack);
      return this.errorResponse.internalServerError();
    }
  }
}
