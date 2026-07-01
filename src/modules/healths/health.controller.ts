import { ModuleName } from '@/common/base/enums';
import { Auth } from '@/modules/auth/decorators';
import { AuthType } from '@/modules/auth/enums';
import { QueueStatsQueryDto } from '@/modules/healths/dtos';
import {
  DbHealthSwaggerDocs,
  QueueListSwaggerDocs,
  QueueStatsSwaggerDocs,
} from '@/modules/healths/swaggers';
import { SuccessResponse } from '@/shared/response';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

/**
 * Controller exposing infrastructure health-check endpoints.
 *
 * All routes are publicly accessible (no authentication required).
 *
 * @module Health
 */
@Auth(AuthType.None)
@ApiTags('Health')
@Controller('health')
export class HealthController {
  /**
   * @param healthService - Service performing the underlying health checks.
   * @param successResponse - Utility for building standardised success responses.
   */
  constructor(
    private readonly healthService: HealthService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Checks connectivity and responsiveness of the primary database.
   *
   * @returns A standardised success response containing the database health status.
   */
  @Get('database')
  @DbHealthSwaggerDocs()
  async dbHealth() {
    const result = await this.healthService.dbHealth();
    return this.successResponse.ok({
      module: ModuleName.Health,
      key: 'db-health',
      ...result,
    });
  }

  /**
   * Returns statistics for a specific message queue.
   *
   * @param query - Query parameters identifying the queue and optional filters.
   * @returns A standardised success response containing queue statistics.
   */
  @Get('queue-stats')
  @QueueStatsSwaggerDocs()
  async getQueueStats(@Query() query: QueueStatsQueryDto) {
    const result = await this.healthService.queueStats(query);
    return this.successResponse.ok({ module: ModuleName.Health, key: 'queue-stats', ...result });
  }

  /**
   * Returns a list of all registered message queues and their current state.
   *
   * @returns A standardised success response containing the queue list.
   */
  @Get('queues')
  @QueueListSwaggerDocs()
  async queueList() {
    const result = await this.healthService.queueList();
    return this.successResponse.ok({ module: ModuleName.Health, key: 'queue-list', ...result });
  }
}
