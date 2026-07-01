import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function DeleteServerErrorSwaggerDocs() {
  const path = `${ModuleName.ErrorTracking}/:id`;
  const method = HttpMethod.DELETE;

  return applyDecorators(
    ApiOperation({
      summary: 'Delete a server error',
      description: 'Permanently deletes a server-error record. This action cannot be undone.',
    }),
    ApiParam({ name: 'id', type: Number, description: 'Server error ID' }),
    SwaggerApiSuccessResponse(null as any, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Server error deleted successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
