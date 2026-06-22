import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ConflictResponse, ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { UpdatePermissionDto } from '@/modules/permissions/dtos/update-permission.dto';
import { PermissionResponseDto } from '@/modules/permissions/dtos/permission-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

/**
 * Composed Swagger decorator for the `PATCH /permissions/:id` endpoint.
 *
 * Attaches the operation summary, `:id` path parameter, request-body schema,
 * 200 success response with a {@link PermissionResponseDto} schema, and all
 * documented error responses (401, 403, 404, 409, 500) to the controller action.
 *
 * @returns A NestJS `MethodDecorator` produced by `applyDecorators`.
 */
export function UpdatePermissionSwaggerDocs() {
  const path = `${ModuleName.Permission}/:id`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiOperation({
      summary: 'Update a permission by ID',
      description: 'Updates the name, key, or description of a permission. The key must remain unique.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Permission ID' }),
    ApiBody({ type: UpdatePermissionDto }),

    SwaggerApiSuccessResponse(PermissionResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Permission updated successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    ConflictResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
