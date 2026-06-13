import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { QueueDto, QueueStatsQueryDto, QueueStatsResponseDto } from '@/modules/healths/dtos';
import { RabbitMqQueueApiResponse } from '@/modules/healths/providers/interfaces';
import { HttpClientService } from '@/shared/http-client';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueStatsProvider {
  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
    private readonly errorResponse: ErrorResponse,
    private readonly httpClient: HttpClientService,
  ) {}

  /**
   * Convert idle_since ISO string to seconds since last message
   * @param idleSince ISO date string
   * @returns seconds elapsed or undefined
   */
  private idleSinceSeconds(idleSince?: string): number | undefined {
    if (!idleSince) return undefined;
    return Math.floor((Date.now() - new Date(idleSince).getTime()) / 1000);
  }

  /**
   * Fetch RabbitMQ queue stats with enriched metrics
   * @param query Queue name query
   * @returns Queue stats DTO or error response
   */
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
