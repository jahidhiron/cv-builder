import { ModuleName } from '@/common/base/enums';
import { ParseIdPipe } from '@/common/pipes';
import { SuccessResponse } from '@/shared/response';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { RequestLogListQueryDto, SystemActivityLogQueryDto, UserActivityLogQueryDto } from './dtos';
import {
  FindRequestLogDetailSwaggerDocs,
  FindSystemActivityLogDetailSwaggerDocs,
  FindUserActivityLogDetailSwaggerDocs,
  ListRequestLogsSwaggerDocs,
  ListSystemActivityLogsSwaggerDocs,
  ListUserActivityLogsSwaggerDocs,
} from './swaggers';

/**
 * Administrator controller for browsing request, user, and system activity logs.
 *
 * Exposes read-only paginated endpoints consumed by admin dashboards.
 * All routes require a valid bearer token.
 *
 * Base route: `/activity-log`
 *
 * **Route order matters**: `:id` is declared last so it never shadows the
 * literal `users` / `system` sub-routes.
 */
@ApiTags('Activity Log')
@ApiBearerAuth()
@Controller(ModuleName.ActivityLog)
export class ActivityLogController {
  /**
   * @param activityLogService - Service delegating all activity-log queries.
   * @param successResponse - Utility for building standardised success responses.
   */
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Returns a paginated list of request logs, each annotated with
   * `systemLogCount` and `userLogCount`.
   *
   * Delegates to {@link ActivityLogService.listRequestLogs} and wraps the
   * result in a standard success envelope.
   *
   * `GET /activity-log`
   *
   * @param query - Pagination, sorting, and search parameters.
   * @returns A paginated success response containing {@link RequestLogListItem} rows.
   */
  @Get()
  @ListRequestLogsSwaggerDocs()
  async list(@Query() query: RequestLogListQueryDto) {
    const result = await this.activityLogService.listRequestLogs(query);
    return this.successResponse.ok({
      module: ModuleName.ActivityLog,
      key: 'request-logs-list',
      ...result,
    });
  }

  /**
   * Returns a paginated list of user activity log entries.
   *
   * Delegates to {@link ActivityLogService.listUserLogs} and wraps the result
   * in a standard success envelope.
   *
   * `GET /activity-log/users`
   *
   * @param query - Pagination, sorting, and filter parameters.
   * @returns A paginated success response containing {@link UserActivityLog} rows.
   */
  @Get('users')
  @ListUserActivityLogsSwaggerDocs()
  async listUserLogs(@Query() query: UserActivityLogQueryDto) {
    const result = await this.activityLogService.listUserLogs(query);
    return this.successResponse.ok({
      module: ModuleName.ActivityLog,
      key: 'user-activity-logs',
      ...result,
    });
  }

  /**
   * Returns a paginated list of system activity log entries.
   *
   * Delegates to {@link ActivityLogService.listSystemLogs} and wraps the result
   * in a standard success envelope.
   *
   * `GET /activity-log/system`
   *
   * @param query - Pagination, sorting, and filter parameters.
   * @returns A paginated success response containing {@link SystemActivityLog} rows.
   */
  @Get('system')
  @ListSystemActivityLogsSwaggerDocs()
  async listSystemLogs(@Query() query: SystemActivityLogQueryDto) {
    const result = await this.activityLogService.listSystemLogs(query);
    return this.successResponse.ok({
      module: ModuleName.ActivityLog,
      key: 'system-activity-logs',
      ...result,
    });
  }

  /**
   * Returns a single user activity log entry by ID.
   *
   * Delegates to {@link ActivityLogService.getUserLogDetail} and wraps the
   * result in a standard success envelope.
   *
   * `GET /activity-log/users/:id`
   *
   * @param id - User-activity-log ID parsed and validated by `ParseIdPipe`.
   * @returns A success response containing the {@link UserActivityLog}.
   * @throws {NotFoundException} When no user-activity-log row matches `id`.
   */
  @Get('users/:id')
  @FindUserActivityLogDetailSwaggerDocs()
  async findUserLog(@Param('id', ParseIdPipe) id: number) {
    const result = await this.activityLogService.getUserLogDetail({ id });
    return this.successResponse.ok({
      module: ModuleName.ActivityLog,
      key: 'user-activity-log-detail',
      ...result,
    });
  }

  /**
   * Returns a single system activity log entry by ID.
   *
   * Delegates to {@link ActivityLogService.getSystemLogDetail} and wraps the
   * result in a standard success envelope.
   *
   * `GET /activity-log/system/:id`
   *
   * @param id - System-activity-log ID parsed and validated by `ParseIdPipe`.
   * @returns A success response containing the {@link SystemActivityLog}.
   * @throws {NotFoundException} When no system-activity-log row matches `id`.
   */
  @Get('system/:id')
  @FindSystemActivityLogDetailSwaggerDocs()
  async findSystemLog(@Param('id', ParseIdPipe) id: number) {
    const result = await this.activityLogService.getSystemLogDetail({ id });
    return this.successResponse.ok({
      module: ModuleName.ActivityLog,
      key: 'system-activity-log-detail',
      ...result,
    });
  }

  /**
   * Returns a single request log merged with every system and user activity
   * log entry correlated to it, each normalized into its own chronologically
   * sorted array.
   *
   * Delegates to {@link ActivityLogService.getRequestLogDetail} and wraps the
   * result in a standard success envelope.
   *
   * `GET /activity-log/:id`
   *
   * @param id - Request-log ID parsed and validated by `ParseIdPipe`.
   * @returns A success response containing the {@link RequestLogDetail}.
   * @throws {NotFoundException} When no request-log row matches `id`.
   */
  @Get(':id')
  @FindRequestLogDetailSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.activityLogService.getRequestLogDetail({ id });
    return this.successResponse.ok({
      module: ModuleName.ActivityLog,
      key: 'request-log-detail',
      ...result,
    });
  }
}
