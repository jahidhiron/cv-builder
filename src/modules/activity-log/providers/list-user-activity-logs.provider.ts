import type { PaginatedResult } from '@/common/base/repositories/interfaces';
import { Injectable } from '@nestjs/common';
import { UserActivityLogQueryDto } from '../dtos';
import { UserActivityLog } from '../entities';
import { UserActivityLogRepository } from '../repositories';

/**
 * Returns a paginated list of user activity logs.
 * Calls the repository directly — does not extend a base provider to avoid
 * coupling infrastructure logging to the feature provider hierarchy.
 */
@Injectable()
export class ListUserActivityLogsProvider {
  /**
   * @param repo - Repository used to run the paginated activity-log query.
   */
  constructor(private readonly repo: UserActivityLogRepository) {}

  /**
   * Returns a paginated list of user activity logs, optionally filtered by status.
   *
   * @param dto - Query DTO containing pagination, sorting, search term, and optional status filter.
   * @returns Paginated {@link UserActivityLog} results.
   */
  async execute(dto: UserActivityLogQueryDto): Promise<PaginatedResult<UserActivityLog>> {
    return this.repo.paginatedList({
      q: dto.q,
      page: dto.page,
      limit: dto.limit,
      sortBy: dto.sortBy,
      searchBy: ['action'],
      ...(dto.status !== undefined && { query: { status: dto.status } }),
    });
  }
}
