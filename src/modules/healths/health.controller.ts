import { ModuleName } from '@/common/enums';
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

@Auth(AuthType.None)
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly successResponse: SuccessResponse,
  ) {}

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

  @Get('queue-stats')
  @QueueStatsSwaggerDocs()
  async getQueueStats(@Query() query: QueueStatsQueryDto) {
    const result = await this.healthService.queueStats(query);
    return this.successResponse.ok({ module: ModuleName.Health, key: 'queue-stats', ...result });
  }

  @Get('queues')
  @QueueListSwaggerDocs()
  async queueList() {
    const result = await this.healthService.queueList();
    return this.successResponse.ok({ module: ModuleName.Health, key: 'queue-list', ...result });
  }
}
