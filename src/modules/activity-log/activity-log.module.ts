import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { LogBundleConsumer } from './consumers';
import { RequestLogInterceptor } from './interceptors';
import {
  FindRequestLogDetailProvider,
  FindSystemActivityLogDetailProvider,
  FindUserActivityLogDetailProvider,
  ListRequestLogsProvider,
  ListSystemActivityLogsProvider,
  ListUserActivityLogsProvider,
  LogRequestProvider,
  LogSystemActivityProvider,
  LogUserActivityProvider,
} from './providers';
import { LogBundleProducer } from './producers';
import {
  RequestLogRepository,
  SystemActivityLogRepository,
  UserActivityLogRepository,
} from './repositories';

/**
 * Feature module that provides the complete activity-log subsystem.
 *
 * **Responsibilities:**
 * - Persists one `request_logs` row per HTTP request via {@link RequestLogInterceptor},
 *   registered globally as `APP_INTERCEPTOR`.
 * - Records provider-level operations via the `@SystemLog` decorator through
 *   {@link LogSystemActivityProvider} and {@link ActivityLogRegistry}.
 * - Records user-facing actions via {@link LogUserActivityProvider}.
 * - Optionally defers all DB writes to a RabbitMQ consumer ({@link LogBundleConsumer})
 *   when `ENABLE_RABBITMQ=true`.
 *
 * **Exports:**
 * - {@link ActivityLogService} — for modules that call `logUser()` / `logSystem()` directly.
 * - {@link LogRequestProvider} — for modules that need to create request log rows manually.
 *
 * **Note:** `ActivityLogService` is injected into the module constructor to guarantee
 * NestJS instantiates it (and populates {@link ActivityLogRegistry}) before any
 * HTTP request is served.
 */
@Module({
  imports: [ConfigModule],
  controllers: [ActivityLogController, LogBundleConsumer],
  providers: [
    RequestLogRepository,
    UserActivityLogRepository,
    SystemActivityLogRepository,
    LogRequestProvider,
    LogUserActivityProvider,
    LogSystemActivityProvider,
    ListUserActivityLogsProvider,
    ListSystemActivityLogsProvider,
    ListRequestLogsProvider,
    FindRequestLogDetailProvider,
    FindSystemActivityLogDetailProvider,
    FindUserActivityLogDetailProvider,
    ActivityLogService,
    LogBundleProducer,
    { provide: APP_INTERCEPTOR, useClass: RequestLogInterceptor },
  ],
  exports: [ActivityLogService, LogRequestProvider],
})
export class ActivityLogModule {
  /**
   * @param _activityLogService - Injected only to force NestJS to instantiate
   *   `ActivityLogService` (and populate {@link ActivityLogRegistry}) before
   *   any HTTP request is served; not otherwise used within this class.
   */
  constructor(_activityLogService: ActivityLogService) {}
}
