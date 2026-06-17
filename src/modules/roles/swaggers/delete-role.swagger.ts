import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { BadRequestResponse, ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

export function DeleteRoleSwaggerDocs() {
  const path = `${ModuleName.Role}/:id`;
  const method = HttpMethod.DELETE;

  return applyDecorators(
    ApiOperation({
      summary: 'Delete a role',
      description: 'Soft-deletes a role by default. Pass ?force=true for permanent (hard) deletion. Built-in roles (user, admin) cannot be deleted.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),
    ApiQuery({ name: 'force', required: false, type: Boolean, description: 'Permanently delete the role instead of archiving it' }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Role deleted successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    BadRequestResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
