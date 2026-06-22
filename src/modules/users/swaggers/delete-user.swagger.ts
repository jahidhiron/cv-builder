import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

export function DeleteUserSwaggerDocs() {
  const path = `${ModuleName.User}/:id`;
  const method = HttpMethod.DELETE;

  return applyDecorators(
    ApiOperation({
      summary: 'Delete a user',
      description: 'Soft-deletes a user by default. Pass ?force=true for permanent (hard) deletion.',
    }),
    ApiParam({ name: 'id', type: Number, description: 'User ID' }),
    ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Permanently delete the user instead of archiving them' }),
    SwaggerApiSuccessResponse(null as any, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'User deleted successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
