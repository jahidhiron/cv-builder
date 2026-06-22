import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse } from '@/common/swagger';
import { QueueListResponseDto } from '@/modules/healths/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function QueueListSwaggerDocs() {
  const path = `${ModuleName.Health}/queues`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get list of RabbitMQ queues',
      description:
        'Retrieves all RabbitMQ queues with detailed statistics, including total messages, ready/unacknowledged messages, number of consumers, memory usage, throughput rates, queue type, and dead-letter configuration.',
    }),

    SwaggerApiSuccessResponse(QueueListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'RabbitMQ queue list retrieved successful',
    }),

    InternalServerErrorResponse({
      path,
      method,
    }),
  );
}
