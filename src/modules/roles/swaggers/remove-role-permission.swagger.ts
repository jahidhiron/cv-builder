import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function RemoveRolePermissionSwaggerDocs() {
  const path = `${ModuleName.Role}/:id/permissions/:permissionId`;
  const method = HttpMethod.DELETE;

  return applyDecorators(
    ApiOperation({
      summary: 'Remove a permission from a role',
      description: 'Removes a specific permission assignment from a role. Returns 404 if the permission is not assigned.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),
    ApiParam({ name: 'permissionId', type: Number, description: 'Permission ID' }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Permission removed from role successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
