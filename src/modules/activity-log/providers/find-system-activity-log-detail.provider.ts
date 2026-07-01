import { ModuleName } from '@/common/base/enums';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';
import { SystemActivityLog } from '../entities';
import { SystemActivityLogRepository } from '../repositories';

/**
 * Retrieves a single system activity log by any `FindOptionsWhere<SystemActivityLog>` criteria.
 *
 * Calls the repository directly — does not extend `BaseFindOneProvider` (and
 * skips the `@SystemLog` decorator) to avoid the infrastructure logging
 * feedback loop of activity-log reads generating their own activity-log
 * entries (mirrors the precedent in `ListSystemActivityLogsProvider`).
 */
@Injectable()
export class FindSystemActivityLogDetailProvider {
  /**
   * @param repo          - Repository used to look up the `system_activity_logs` row.
   * @param errorResponse - Shared helper that throws typed `HttpException`s.
   */
  constructor(
    private readonly repo: SystemActivityLogRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * @param where - TypeORM `FindOptionsWhere<SystemActivityLog>` filter conditions.
   * @returns The matching {@link SystemActivityLog} row.
   * @throws {NotFoundException} When no row matches `where`.
   */
  async execute(where: FindOptionsWhere<SystemActivityLog>): Promise<SystemActivityLog> {
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