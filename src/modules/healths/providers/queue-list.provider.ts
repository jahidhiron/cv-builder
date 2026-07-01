import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { SystemLog } from '@/modules/activity-log/decorators';
import { QueueDto, QueueListResponseDto } from '@/modules/healths/dtos';
import { RabbitMqQueueApiResponse } from '@/modules/healths/providers/interfaces';
import { HttpClientService } from '@/shared/http-client';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

/**
 * Provider that fetches all RabbitMQ queues from the management API
 * and returns them as enriched {@link QueueDto} objects.
 *
 * Optionally filters to a single queue when `RABBITMQ_QUEUE` is configured.
 *
 * @module Health
 */
@Injectable()
export class QueueListProvider {
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
   * Fetches all queues from the RabbitMQ management API and maps them to {@link QueueDto} objects.
   *
   * Each DTO includes message counts, consumer count, publish/deliver/ack rates,
   * memory usage, idle time, and dead-letter configuration.
   * Returns a 404 when no queues are found and a 500 on unexpected errors.
   *
   * @returns A {@link QueueListResponseDto} on success, or an error response on failure.
   */
  @SystemLog(ModuleName.Health)
  async execute(): Promise<QueueListResponseDto> {
    const { apiURI, username, password, rabbitmqQueue } = this.configService.rabbitmq;
    const url = `${apiURI}/queues/%2f`;

    try {
      const response = await firstValueFrom(
        this.httpClient.get<RabbitMqQueueApiResponse[]>(url, {
          auth: { username, password },
        }),
      );

      const data = response?.data ?? [];
      if (!data.length) {
        return this.errorResponse.notFound({
          module: ModuleName.Health,
          key: 'queues-not-found',
        });
      }

      const filtered = rabbitmqQueue ? data.filter((q) => q.name === rabbitmqQueue) : data;

      const queues: QueueDto[] = filtered.map((q) => {
        const stats = q.message_stats ?? {};
        const args = q.arguments ?? {};

        return {
          queue: q.name,
          messages: q.messages,
          ready: q.messages_ready,
          unacked: q.messages_unacknowledged,
          consumers: q.consumers,
          publishRatePerSec: stats.publish_details?.rate,
          deliverGetRatePerSec: stats.deliver_get_details?.rate,
          ackRatePerSec: stats.ack_details?.rate,
          memoryBytes: q.memory,
          durable: q.durable,
          exclusive: q.exclusive,
          idleSinceSeconds: this.idleSinceSeconds(q.idle_since),
          type: q.type,
          deadLetterExchange: args['x-dead-letter-exchange'],
          deadLetterRoutingKey: args['x-dead-letter-routing-key'],
          timestamp: new Date(),
        };
      });

      return { queues };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;

      this.logger.error(`Failed to fetch queues: ${message}`, stack);
      return this.errorResponse.internalServerError();
    }
  }
}
