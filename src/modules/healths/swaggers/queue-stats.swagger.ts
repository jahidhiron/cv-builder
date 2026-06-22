import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse } from '@/common/swagger';
import { QueueStatsResponseDto } from '@/modules/healths/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function QueueStatsSwaggerDocs() {
  const path = `${ModuleName.Health}/queue-stats`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get RabbitMQ queue statistics',
      description:
        'Retrieves current RabbitMQ queue stats, including total messages, ready/unacknowledged messages, number of consumers, memory usage, throughput rates, and queue configuration.',
    }),

    SwaggerApiSuccessResponse(QueueStatsResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'RabbitMQ queue statistics retrieved successful',
    }),

    InternalServerErrorResponse({
      path,
      method,
    }),
  );
}
