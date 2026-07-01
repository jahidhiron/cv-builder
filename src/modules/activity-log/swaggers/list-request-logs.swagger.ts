import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { RequestLogListResponseDto } from '@/modules/activity-log/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ListRequestLogsSwaggerDocs() {
  const path = ModuleName.ActivityLog;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'List request logs with correlated system/user log counts' }),
    SwaggerApiSuccessResponse(RequestLogListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Request logs retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
