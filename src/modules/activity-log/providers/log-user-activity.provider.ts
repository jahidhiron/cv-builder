import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { ActivityLogContext } from '@/modules/activity-log/context';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';
import { UserActivityLog } from '../entities';
import { LogStatus } from '../enums';
import { UserActivityLogRepository } from '../repositories';
import { LogUserActivityParams } from '../interfaces';

/**
 * Persists a user activity log entry directly via the repository.
 *
 * Intentionally does NOT extend `BaseCreateProvider` — doing so would cause
 * infinite recursion because `@SystemLog` on the base's `execute` would try
 * to log its own write, which would trigger another write, and so on.
 *
 * When RabbitMQ is enabled, `log()` pushes to the request's pending list
 * (via ActivityLogContext) instead of writing to the DB directly. The
 * RequestLogInterceptor ships the full bundle to RabbitMQ at request end.
 * Falls back to a direct DB write when outside a request scope or when
 * RabbitMQ is disabled.
 *
 * requestLogId is read from the request context automatically so callers
 * never need to thread it through manually.
 */
@Injectable()
export class LogUserActivityProvider {
  /**
   * @param repo          - Repository used to persist user activity log rows.
   * @param logger        - Application logger used to report write failures from `log()`.
   * @param configService - Config service consulted for the RabbitMQ-enabled flag.
   */
  constructor(
    private readonly repo: UserActivityLogRepository,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Persists a single user activity log row directly via the repository.
   * Defaults `requestLogId` to the current request context when not provided.
   *
   * @param dto - User activity log fields to persist.
   * @returns The created {@link UserActivityLog} entity.
   */
  async execute(dto: LogUserActivityParams): Promise<UserActivityLog> {
    const ctx = ActivityLogContext.get();
    return this.repo.create({
      action: dto.action,
      userId: dto.userId ?? null,
      status: dto.status ?? LogStatus.Success,
      requestLogId: dto.requestLogId ?? ctx.requestLogId,
      metadata: dto.metadata ?? null,
    } as DeepPartial<UserActivityLog>);
  }

  /**
   * When RabbitMQ is enabled, appends to the in-flight request's pending list.
   * Falls back to a direct fire-and-forget DB write otherwise.
   *
   * @param params - User activity log fields to record.
   */
  log(params: LogUserActivityParams): void {
    if (this.configService.rabbitmq.enableRabbitmq && ActivityLogContext.pushUserLog(params)) {
      return;
    }

    this.execute(params).catch((err: unknown) => {
      this.logger.error(
        `User activity log write failed for action "${params.action}": ${(err as Error).message}`,
        ModuleName.ActivityLog,
      );
    });
  }
}
