import type { PaginatedResult } from '@/common/base/repositories/interfaces';
import { Injectable } from '@nestjs/common';
import { SystemActivityLogQueryDto } from '../dtos';
import { SystemActivityLog } from '../entities';
import { SystemActivityLogRepository } from '../repositories';

/**
 * Returns a paginated list of system activity logs.
 * Calls the repository directly — does not extend a base provider to avoid
 * coupling infrastructure logging to the feature provider hierarchy.
 */
@Injectable()
export class ListSystemActivityLogsProvider {
  /**
   * @param repo - Repository used to run the paginated activity-log query.
   */
  constructor(private readonly repo: SystemActivityLogRepository) {}

  /**
   * Returns a paginated list of system activity logs, optionally filtered by status and module.
   *
   * @param dto - Query DTO containing pagination, sorting, search term, and optional status/module filters.
   * @returns Paginated {@link SystemActivityLog} results, sorted by `executedAt` descending by default.
   */
  async execute(dto: SystemActivityLogQueryDto): Promise<PaginatedResult<SystemActivityLog>> {
    const query: Record<string, unknown> = {};
    if (dto.status !== undefined) query['status'] = dto.status;
    if (dto.module !== undefined) query['module'] = dto.module;

    return this.repo.paginatedList({
      q: dto.q,
      page: dto.page,
      limit: dto.limit,
      sortBy: dto.sortBy ?? [{ whom: 'executedAt', order: 'DESC' }],
      searchBy: ['module', 'className', 'fn'],
      ...(Object.keys(query).length > 0 && { query }),
    });
  }
}
