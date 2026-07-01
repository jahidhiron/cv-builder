import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { SystemActivityLogListResponseDto } from '@/modules/activity-log/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ListSystemActivityLogsSwaggerDocs() {
  const path = `${ModuleName.ActivityLog}/system`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'List system activity logs with pagination, status, and module filters' }),
    SwaggerApiSuccessResponse(SystemActivityLogListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'System activity logs retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
