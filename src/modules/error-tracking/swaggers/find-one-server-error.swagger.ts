import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { ServerErrorResponseDto } from '@/modules/error-tracking/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function FindOneServerErrorSwaggerDocs() {
  const path = `${ModuleName.ErrorTracking}/:id`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'Get server error by ID' }),
    ApiParam({ name: 'id', type: Number }),
    SwaggerApiSuccessResponse(ServerErrorResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Server error retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
