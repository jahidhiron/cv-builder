import { ModuleName } from '@/common/base/enums';
import { AppLogger } from '@/config/logger';
import { EventNames } from '../constants';
import { ServiceNames } from '@/infrastructure/rabbitmq/constants/service-name.constant';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { ClientProxy } from '@nestjs/microservices';
import type { LogBundle } from '../interfaces';

/**
 * Produces a {@link LogBundle} message to RabbitMQ so all DB writes for one
 * HTTP request (request log, system logs, user logs) are handled in a single
 * background job by {@link LogBundleConsumer}.
 *
 * The RabbitMQ `ClientProxy` is resolved lazily via `ModuleRef` so
 * `ActivityLogModule` does not need to import `RabbitMqModule` directly —
 * the client is located in the global module graph via `strict: false`.
 * When RabbitMQ is disabled (`ENABLE_RABBITMQ=false`) the client is never
 * registered and `resolveClient` returns `null`, making `produce` a no-op.
 */
@Injectable()
export class LogBundleProducer {
  private client: ClientProxy | null = null;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Lazily resolves the RabbitMQ `ClientProxy` from the global module graph.
   *
   * Returns `null` when `RabbitMqModule` is not loaded, allowing the producer
   * to degrade gracefully without throwing.
   *
   * @returns The `ClientProxy` instance, or `null` if unavailable.
   */
  private resolveClient(): ClientProxy | null {
    if (this.client !== null) return this.client;
    try {
      this.client = this.moduleRef.get<ClientProxy>(ServiceNames.CV_BUILDER_SYNC, {
        strict: false,
      });
    } catch {
      // RabbitMQ module is not loaded (ENABLE_RABBITMQ=false).
    }
    return this.client;
  }

  /**
   * Emits a log bundle to the `LOG_ACTIVITY` RabbitMQ event.
   *
   * Fire-and-forget — emit errors are logged but never re-thrown so a
   * messaging failure never disrupts the HTTP response. No-ops silently when
   * the RabbitMQ client is unavailable.
   *
   * @param bundle - The {@link LogBundle} to emit.
   */
  produce(bundle: LogBundle): void {
    const client = this.resolveClient();
    if (!client) return;

    client.emit(EventNames.LOG_ACTIVITY, bundle).subscribe({
      next: () => {
        this.logger.log(
          `Log bundle produced: systemLogs=${bundle.systemLogs.length}, userLogs=${bundle.userLogs.length}`,
          ModuleName.ActivityLog,
        );
      },
      error: (err: unknown) => {
        this.logger.error(
          `Log bundle produce failed: ${(err as Error).message}`,
          ModuleName.ActivityLog,
        );
      },
    });
  }
}
