import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse } from '@/common/swagger';
import { DbHealthResponseDto } from '@/modules/healths/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function DbHealthSwaggerDocs() {
  const path = `${ModuleName.Health}/database`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get database health status',
      description:
        'This endpoint retrieves the current health status of the database, including latency, connection stats, uptime, running threads, and queries per second.',
    }),

    SwaggerApiSuccessResponse(DbHealthResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Database health status retrieved successful',
    }),

    InternalServerErrorResponse({
      path,
      method,
    }),
  );
}
