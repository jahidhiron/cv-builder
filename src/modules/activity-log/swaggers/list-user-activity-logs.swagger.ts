import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { UserActivityLogListResponseDto } from '@/modules/activity-log/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ListUserActivityLogsSwaggerDocs() {
  const path = `${ModuleName.ActivityLog}/users`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'List user activity logs with pagination and status filter' }),
    SwaggerApiSuccessResponse(UserActivityLogListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'User activity logs retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
