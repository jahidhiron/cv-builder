import { ModuleName } from '@/common/base/enums';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';
import { RequestLog, SystemActivityLog, UserActivityLog } from '../entities';
import type { RequestLogDetail, RequestLogSystemEntry, RequestLogUserEntry } from '../interfaces';
import {
  RequestLogRepository,
  SystemActivityLogRepository,
  UserActivityLogRepository,
} from '../repositories';

/**
 * Retrieves a single request-log record together with every system and user
 * activity log entry correlated to it, each normalized into its own
 * chronologically sorted array for a frontend timeline/tree view.
 *
 * Injects three repositories directly rather than composing over other
 * providers because the read genuinely spans three tables joined only by
 * `requestLogId` (mirrors the precedent in `AssignRolePermissionsProvider`).
 */
@Injectable()
export class FindRequestLogDetailProvider {
  /**
   * @param requestLogRepo     - Repository used to look up the `request_logs` row.
   * @param systemActivityLogRepo - Repository used to fetch correlated system activity logs.
   * @param userActivityLogRepo   - Repository used to fetch correlated user activity logs.
   * @param errorResponse      - Shared helper that throws typed `HttpException`s.
   */
  constructor(
    private readonly requestLogRepo: RequestLogRepository,
    private readonly systemActivityLogRepo: SystemActivityLogRepository,
    private readonly userActivityLogRepo: UserActivityLogRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * @param where - TypeORM `FindOptionsWhere<RequestLog>` filter conditions.
   * @returns The request log merged with `systemLogs` and `userLogs` arrays.
   * @throws {NotFoundException} When no request-log row matches `where`.
   */
  async execute(where: FindOptionsWhere<RequestLog>): Promise<RequestLogDetail> {
    const requestLog = await this.requestLogRepo.findOne(where);
    if (!requestLog) {
      return this.errorResponse.notFound({
        module: ModuleName.ActivityLog,
        key: 'activity-log-not-found',
      });
    }

    const [systemLogs, userLogs] = await Promise.all([
      this.systemActivityLogRepo.findMany(
        { requestLogId: requestLog.id },
        { order: { executedAt: 'ASC' } },
      ),
      this.userActivityLogRepo.findMany(
        { requestLogId: requestLog.id },
        { order: { createdAt: 'ASC' } },
      ),
    ]);

    return {
      ...requestLog,
      systemLogs: systemLogs.map((log) => this.toSystemEntry(log)),
      userLogs: userLogs.map((log) => this.toUserEntry(log)),
    };
  }

  /**
   * Normalizes a {@link SystemActivityLog} row into a {@link RequestLogSystemEntry}.
   *
   * @param log - The raw system activity log entity.
   * @returns The normalized entry, with `label` derived from `className.fn`
   *          and `timestamp` falling back to `createdAt` when `executedAt` is unset.
   */
  private toSystemEntry(log: SystemActivityLog): RequestLogSystemEntry {
    return {
      id: log.id,
      label: `${log.className}.${log.fn}`,
      timestamp: log.executedAt ?? log.createdAt,
      status: log.status,
      module: log.module,
      className: log.className,
      fn: log.fn,
      durationMs: log.durationMs,
      userId: log.userId,
      input: log.input,
      output: log.output,
      error: log.error,
    };
  }

  /**
   * Normalizes a {@link UserActivityLog} row into a {@link RequestLogUserEntry}.
   *
   * @param log - The raw user activity log entity.
   * @returns The normalized entry, with `label` set to the log's `action`.
   */
  private toUserEntry(log: UserActivityLog): RequestLogUserEntry {
    return {
      id: log.id,
      label: log.action,
      timestamp: log.createdAt,
      status: log.status,
      userId: log.userId,
      metadata: log.metadata,
    };
  }
}
