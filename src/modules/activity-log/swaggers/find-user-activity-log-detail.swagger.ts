import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { UserActivityLogDetailResponseDto } from '@/modules/activity-log/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindUserActivityLogDetailSwaggerDocs() {
  const path = `${ModuleName.ActivityLog}/users/:id`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'Get user activity log by ID' }),
    ApiParam({ name: 'id', type: Number }),
    SwaggerApiSuccessResponse(UserActivityLogDetailResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'User activity log detail retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}