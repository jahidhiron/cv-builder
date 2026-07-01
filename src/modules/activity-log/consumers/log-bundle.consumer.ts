import { ModuleName } from '@/common/base/enums';
import { AppLogger } from '@/config/logger';
import { EventNames } from '../constants';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import type { DeepPartial } from 'typeorm';
import { SystemActivityLog } from '../entities/system-activity-log.entity';
import { UserActivityLog } from '../entities/user-activity-log.entity';
import { RequestLog } from '../entities/request-log.entity';
import { LogStatus } from '../enums';
import type { LogBundle } from '../interfaces/log-bundle.interface';
import { RequestLogRepository, SystemActivityLogRepository, UserActivityLogRepository } from '../repositories';

/**
 * RabbitMQ consumer that persists the deferred {@link LogBundle} produced by
 * `RequestLogInterceptor` (when `ENABLE_RABBITMQ=true`) into the database.
 *
 * **Insertion order** satisfies FK constraints:
 *   1. `request_logs` row — inserted first to obtain the PK (`requestLogId`).
 *   2. `system_activity_logs` rows — bulk-inserted via `createMany` in execution
 *      order so IDs reflect the sequence in which providers ran during the request.
 *   3. `user_activity_logs` rows — bulk-inserted via `createMany`.
 *
 * **Error handling**: the message is always ack'd, even on failure.
 * Logging errors must never cause infinite requeue cycles that stall the queue.
 * Failures are logged via `AppLogger` for observability.
 */
@Controller()
export class LogBundleConsumer {
  constructor(
    private readonly requestLogRepo: RequestLogRepository,
    private readonly systemLogRepo: SystemActivityLogRepository,
    private readonly userLogRepo: UserActivityLogRepository,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Handles a `LOG_ACTIVITY` event delivered by RabbitMQ.
   *
   * Inserts all three log types from the bundle in the correct FK order.
   * The channel message is ack'd unconditionally — on success after all inserts,
   * and on failure after logging the error — to prevent queue stalls.
   *
   * @param bundle - The {@link LogBundle} payload published by {@link LogBundleProducer}.
   * @param context - The RabbitMQ context, used to ack the message.
   */
  @EventPattern(EventNames.LOG_ACTIVITY)
  async handle(@Payload() bundle: LogBundle, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef() as { ack: (msg: unknown) => void };
    const message = context.getMessage();

    try {
      const requestLog = await this.requestLogRepo.create(
        bundle.requestLog as DeepPartial<RequestLog>,
      );
      const requestLogId = requestLog.id;

      if (bundle.systemLogs.length > 0) {
        await this.systemLogRepo.createMany(
          bundle.systemLogs.map((log) => ({
            module: log.module,
            className: log.className,
            fn: log.fn,
            status: log.status ?? LogStatus.Success,
            durationMs: log.durationMs ?? null,
            executedAt: log.executedAt ?? null,
            userId: log.userId ?? null,
            input: log.input ?? null,
            output: log.output ?? null,
            error: log.error ?? null,
            requestLogId,
          })) as DeepPartial<SystemActivityLog>[],
        );
      }

      if (bundle.userLogs.length > 0) {
        await this.userLogRepo.createMany(
          bundle.userLogs.map((log) => ({
            action: log.action,
            userId: log.userId ?? null,
            status: log.status ?? LogStatus.Success,
            metadata: log.metadata ?? null,
            requestLogId,
          })) as DeepPartial<UserActivityLog>[],
        );
      }

      this.logger.log(
        `Log bundle consumed: requestLogId=${requestLogId}, systemLogs=${bundle.systemLogs.length}, userLogs=${bundle.userLogs.length}`,
        ModuleName.ActivityLog,
      );
      channel.ack(message);
    } catch (err) {
      this.logger.error(
        `Log bundle consumer failed: ${(err as Error).message}`,
        ModuleName.ActivityLog,
      );
      // Ack even on failure — logging errors must not stall the queue.
      channel.ack(message);
    }
  }
}
