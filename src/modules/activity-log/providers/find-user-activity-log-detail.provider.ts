import { ModuleName } from '@/common/base/enums';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';
import { UserActivityLog } from '../entities';
import { UserActivityLogRepository } from '../repositories';

/**
 * Retrieves a single user activity log by any `FindOptionsWhere<UserActivityLog>` criteria.
 *
 * Calls the repository directly — does not extend `BaseFindOneProvider` (and
 * skips the `@SystemLog` decorator) to avoid the infrastructure logging
 * feedback loop of activity-log reads generating their own activity-log
 * entries (mirrors the precedent in `ListUserActivityLogsProvider`).
 */
@Injectable()
export class FindUserActivityLogDetailProvider {
  /**
   * @param repo          - Repository used to look up the `user_activity_logs` row.
   * @param errorResponse - Shared helper that throws typed `HttpException`s.
   */
  constructor(
    private readonly repo: UserActivityLogRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * @param where - TypeORM `FindOptionsWhere<UserActivityLog>` filter conditions.
   * @returns The matching {@link UserActivityLog} row.
   * @throws {NotFoundException} When no row matches `where`.
   */
  async execute(where: FindOptionsWhere<UserActivityLog>): Promise<UserActivityLog> {
    const log = await this.repo.findOne(where);
    if (!log) {
      return this.errorResponse.notFound({
        module: ModuleName.ActivityLog,
        key: 'activity-log-not-found',
      });
    }

    return log;
  }
}
