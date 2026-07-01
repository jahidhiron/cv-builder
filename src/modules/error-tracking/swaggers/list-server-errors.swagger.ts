import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { ServerErrorListResponseDto } from '@/modules/error-tracking/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function ListServerErrorsSwaggerDocs() {
  const path = ModuleName.ErrorTracking;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'List server errors with pagination and status filter' }),
    SwaggerApiSuccessResponse(ServerErrorListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Server errors retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
