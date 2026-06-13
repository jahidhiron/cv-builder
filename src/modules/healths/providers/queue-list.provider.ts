import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { QueueDto, QueueListResponseDto } from '@/modules/healths/dtos';
import { RabbitMqQueueApiResponse } from '@/modules/healths/providers/interfaces';
import { HttpClientService } from '@/shared/http-client';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueListProvider {
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
   * Fetch all RabbitMQ queues with enriched metrics
   * @returns List of queues with stats or error response
   */
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

      // Optional: filter by default queue if needed
      const filtered = rabbitmqQueue ? data.filter((q) => q.name === rabbitmqQueue) : data;

      // Map to professional QueueDto with enriched metrics
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
