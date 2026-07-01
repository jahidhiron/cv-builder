import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';
import { ActivityLogContext } from '../context';
import { SystemActivityLog } from '../entities';
import { LogStatus } from '../enums';
import { SystemActivityLogRepository } from '../repositories';
import { LogSystemActivityParams } from '../interfaces';

/**
 * Persists a system activity log entry directly via the repository.
 *
 * Intentionally does NOT extend `BaseCreateProvider` — doing so would cause
 * infinite recursion because `@SystemLog` on the base's `execute` would try
 * to log its own write, which would trigger another write, and so on.
 *
 * When RabbitMQ is enabled, `log()` pushes to the request's pending list
 * (via ActivityLogContext) instead of writing to the DB directly. The
 * RequestLogInterceptor ships the full bundle to RabbitMQ at request end.
 * Falls back to direct DB write when outside a request scope.
 */
@Injectable()
export class LogSystemActivityProvider {
  private writeQueue: Promise<void> = Promise.resolve();

  /**
   * @param repo          - Repository used to persist system activity log rows.
   * @param logger        - Application logger used to report write failures from `log()`.
   * @param configService - Config service consulted for the RabbitMQ-enabled flag.
   */
  constructor(
    private readonly repo: SystemActivityLogRepository,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Persists a single system activity log row directly via the repository.
   *
   * @param dto - System activity log fields to persist.
   * @returns The created {@link SystemActivityLog} entity.
   */
  async execute(dto: LogSystemActivityParams): Promise<SystemActivityLog> {
    return this.repo.create({
      module: dto.module,
      className: dto.className,
      fn: dto.fn,
      status: dto.status ?? LogStatus.Success,
      durationMs: dto.durationMs ?? null,
      executedAt: dto.executedAt ?? null,
      userId: dto.userId ?? null,
      requestLogId: dto.requestLogId ?? null,
      input: dto.input ?? null,
      output: dto.output ?? null,
      error: dto.error ?? null,
    } as DeepPartial<SystemActivityLog>);
  }

  /**
   * When RabbitMQ is enabled, appends to the in-flight request's pending list
   * so all system logs travel in one bundle. Falls back to a direct serialized
   * DB write (preserving insertion order) when outside a request context or
   * when RabbitMQ is disabled.
   *
   * @param params - System activity log fields to record.
   */
  log(params: LogSystemActivityParams): void {
    if (this.configService.rabbitmq.enableRabbitmq && ActivityLogContext.pushSystemLog(params)) {
      return;
    }

    this.writeQueue = this.writeQueue.then(() =>
      this.execute(params)
        .then(() => undefined)
        .catch((err: unknown) => {
          this.logger.error(
            `System activity log write failed for "${params.className}.${params.fn}": ${(err as Error).message}`,
            ModuleName.ActivityLog,
          );
        }),
    );
  }
}
