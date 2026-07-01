import { BasePaginatedListProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import type { PaginatedResult } from '@/common/base/repositories/interfaces';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { RequestLogListQueryDto } from '../dtos';
import { RequestLog } from '../entities';
import type { RequestLogListItem } from '../interfaces';
import { RequestLogRepository } from '../repositories';

/** Raw row shape returned by the grouped `COUNT(*)` queries. */
interface RequestLogCountRow {
  request_log_id: number;
  count: string;
}

/**
 * Returns a paginated list of {@link RequestLog} records for administrator
 * review, each annotated with `systemLogCount` and `userLogCount`.
 *
 * Free-text search runs across `endpoint`, `method`, and `requestId`. Counts
 * are fetched via two grouped, parameterized `COUNT(*)` queries scoped to the
 * IDs on the current page — never via a JOIN, which would multiply rows.
 */
@Injectable()
export class ListRequestLogsProvider extends BasePaginatedListProvider<
  RequestLog,
  RequestLogListQueryDto
> {
  /**
   * @param repo          - Repository used to run the paginated request-log query.
   * @param errorResponse - Shared helper that throws typed `HttpException`s.
   */
  constructor(repo: RequestLogRepository, errorResponse: ErrorResponse) {
    super(ModuleName.ActivityLog, repo, errorResponse);
  }

  /**
   * Builds the repository query parameters for a paginated request-log listing.
   *
   * Merges the base pagination params from the DTO with a fixed
   * `searchBy: ['endpoint', 'method', 'requestId']`.
   *
   * @param dto - Validated query parameters (page, limit, search term, sort).
   * @returns The fully assembled paginated-list params passed to the repository.
   */
  protected override buildParams(dto: RequestLogListQueryDto) {
    return {
      ...super.buildParams(dto),
      searchBy: ['endpoint', 'method', 'requestId'],
    };
  }

  /**
   * Returns a paginated list of request logs, each merged with its
   * correlated system/user activity log counts.
   *
   * @param dto - Validated query parameters (page, limit, search term, sort).
   * @returns `{ items, meta }` where each item includes `systemLogCount` and `userLogCount`.
   */
  override async execute(dto: RequestLogListQueryDto): Promise<PaginatedResult<RequestLogListItem>> {
    const { items, meta } = await super.execute(dto);
    if (items.length === 0) return { items: [], meta };

    const ids = items.map((item) => item.id);
    const [systemCounts, userCounts] = await Promise.all([
      this.repo.rawQuery<RequestLogCountRow>(
        'SELECT request_log_id, COUNT(*) AS count FROM system_activity_logs WHERE request_log_id = ANY($1) GROUP BY request_log_id',
        [ids],
      ),
      this.repo.rawQuery<RequestLogCountRow>(
        'SELECT request_log_id, COUNT(*) AS count FROM user_activity_logs WHERE request_log_id = ANY($1) GROUP BY request_log_id',
        [ids],
      ),
    ]);

    const systemCountMap = new Map(systemCounts.map((row) => [Number(row.request_log_id), Number(row.count)]));
    const userCountMap = new Map(userCounts.map((row) => [Number(row.request_log_id), Number(row.count)]));

    return {
      items: items.map((item) => ({
        ...item,
        systemLogCount: systemCountMap.get(item.id) ?? 0,
        userLogCount: userCountMap.get(item.id) ?? 0,
      })),
      meta,
    };
  }
}
