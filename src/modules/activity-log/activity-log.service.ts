import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ActivityLogRegistry } from './registry';
import { RequestLogListQueryDto, SystemActivityLogQueryDto, UserActivityLogQueryDto } from './dtos';
import {
  FindRequestLogDetailProvider,
  FindSystemActivityLogDetailProvider,
  FindUserActivityLogDetailProvider,
  ListRequestLogsProvider,
  ListSystemActivityLogsProvider,
  ListUserActivityLogsProvider,
  LogSystemActivityProvider,
  LogUserActivityProvider,
} from './providers';
import { LogSystemActivityParams, LogUserActivityParams } from './interfaces';

/**
 * Facade service for the activity-log subsystem.
 *
 * Acts as the single entry point for writing and querying activity logs.
 * Delegates writes to the appropriate provider and exposes paginated queries
 * for the admin controller.
 *
 * Also manages the {@link ActivityLogRegistry} lifecycle: registers itself on
 * init so the `@SystemLog` decorator can resolve the service without requiring
 * every host class to inject it, and clears the registry on destroy to prevent
 * leaks across hot reloads or test runs.
 */
@Injectable()
export class ActivityLogService implements OnModuleInit, OnModuleDestroy {
  /**
   * @param logUserActivityProvider - Provider that persists or enqueues user-activity log entries.
   * @param logSystemActivityProvider - Provider that persists or enqueues system-activity log entries.
   * @param listUserActivityLogsProvider - Provider for paginated user-activity log listings.
   * @param listSystemActivityLogsProvider - Provider for paginated system-activity log listings.
   * @param listRequestLogsProvider - Provider for paginated request-log listings with correlated counts.
   * @param findRequestLogDetailProvider - Provider that resolves a single request log with its correlated logs.
   * @param findSystemActivityLogDetailProvider - Provider that resolves a single system activity log by ID.
   * @param findUserActivityLogDetailProvider - Provider that resolves a single user activity log by ID.
   */
  constructor(
    private readonly logUserActivityProvider: LogUserActivityProvider,
    private readonly logSystemActivityProvider: LogSystemActivityProvider,
    private readonly listUserActivityLogsProvider: ListUserActivityLogsProvider,
    private readonly listSystemActivityLogsProvider: ListSystemActivityLogsProvider,
    private readonly listRequestLogsProvider: ListRequestLogsProvider,
    private readonly findRequestLogDetailProvider: FindRequestLogDetailProvider,
    private readonly findSystemActivityLogDetailProvider: FindSystemActivityLogDetailProvider,
    private readonly findUserActivityLogDetailProvider: FindUserActivityLogDetailProvider,
  ) {
    ActivityLogRegistry.setService(this);
  }

  /**
   * Registers this instance in {@link ActivityLogRegistry} once the module is
   * fully initialised and before any HTTP request is served.
   */
  onModuleInit(): void {
    ActivityLogRegistry.setService(this);
  }

  /**
   * Clears this instance from {@link ActivityLogRegistry} when the module is
   * torn down, preventing stale references across hot reloads or test runs.
   */
  onModuleDestroy(): void {
    if (ActivityLogRegistry.getService() === this) {
      ActivityLogRegistry.clear();
    }
  }

  /**
   * Persists a user-activity log entry.
   *
   * Fire-and-forget — delegates to {@link LogUserActivityProvider.log} which
   * either enqueues the entry in `AsyncLocalStorage` (RabbitMQ mode) or writes
   * directly to the database.
   *
   * @param params - The user-activity log parameters to persist.
   */
  logUser(params: LogUserActivityParams): void {
    this.logUserActivityProvider.log(params);
  }

  /**
   * Persists a system-activity log entry.
   *
   * Fire-and-forget — delegates to {@link LogSystemActivityProvider.log} which
   * either enqueues the entry in `AsyncLocalStorage` (RabbitMQ mode) or writes
   * directly to the database via a serialised write queue.
   *
   * @param params - The system-activity log parameters to persist.
   */
  logSystem(params: LogSystemActivityParams): void {
    this.logSystemActivityProvider.log(params);
  }

  /**
   * Returns a paginated list of user activity log entries.
   *
   * @param dto - Pagination, sorting, and filter parameters.
   * @returns A promise resolving to a paginated result of {@link UserActivityLog} rows.
   */
  listUserLogs(dto: UserActivityLogQueryDto) {
    return this.listUserActivityLogsProvider.execute(dto);
  }

  /**
   * Returns a paginated list of system activity log entries.
   *
   * @param dto - Pagination, sorting, and filter parameters.
   * @returns A promise resolving to a paginated result of {@link SystemActivityLog} rows.
   */
  listSystemLogs(dto: SystemActivityLogQueryDto) {
    return this.listSystemActivityLogsProvider.execute(dto);
  }

  /**
   * Returns a paginated list of request logs, each annotated with
   * `systemLogCount` and `userLogCount`.
   *
   * @param dto - Pagination, sorting, and search parameters.
   * @returns A promise resolving to a paginated result of {@link RequestLogListItem} rows.
   */
  listRequestLogs(dto: RequestLogListQueryDto) {
    return this.listRequestLogsProvider.execute(dto);
  }

  /**
   * Returns a single request log merged with every system and user activity
   * log entry correlated to it.
   *
   * @param id - Primary key of the `request_logs` row to look up.
   * @returns `{ log }` — the {@link RequestLogDetail}.
   * @throws {NotFoundException} When no request-log row matches `id`.
   */
  async getRequestLogDetail({ id }: { id: number }) {
    const log = await this.findRequestLogDetailProvider.execute({ id });
    return { log };
  }

  /**
   * Returns a single system activity log by ID.
   *
   * @param id - Primary key of the `system_activity_logs` row to look up.
   * @returns `{ log }` — the {@link SystemActivityLog}.
   * @throws {NotFoundException} When no system-activity-log row matches `id`.
   */
  async getSystemLogDetail({ id }: { id: number }) {
    const log = await this.findSystemActivityLogDetailProvider.execute({ id });
    return { log };
  }

  /**
   * Returns a single user activity log by ID.
   *
   * @param id - Primary key of the `user_activity_logs` row to look up.
   * @returns `{ log }` — the {@link UserActivityLog}.
   * @throws {NotFoundException} When no user-activity-log row matches `id`.
   */
  async getUserLogDetail({ id }: { id: number }) {
    const log = await this.findUserActivityLogDetailProvider.execute({ id });
    return { log };
  }
}
