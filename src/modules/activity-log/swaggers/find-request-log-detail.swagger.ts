import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { RequestLogDetailResponseDto } from '@/modules/activity-log/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindRequestLogDetailSwaggerDocs() {
  const path = `${ModuleName.ActivityLog}/:id`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get request log by ID',
      description:
        'Returns a single request log merged with every correlated system and user activity log entry, each normalized into its own chronologically sorted array.',
    }),
    ApiParam({ name: 'id', type: Number }),
    SwaggerApiSuccessResponse(RequestLogDetailResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Request log detail retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
