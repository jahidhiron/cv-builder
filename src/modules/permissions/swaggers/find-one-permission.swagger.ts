import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { PermissionResponseDto } from '@/modules/permissions/dtos/permission-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

/**
 * Composed Swagger decorator for the `GET /permissions/:id` endpoint.
 *
 * Attaches the operation summary, `:id` path parameter, 200 success response
 * with a {@link PermissionResponseDto} schema, and all documented error responses
 * (401, 403, 404, 500) to the controller action.
 *
 * @returns A NestJS `MethodDecorator` produced by `applyDecorators`.
 */
export function FindOnePermissionSwaggerDocs() {
  const path = `${ModuleName.Permission}/:id`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get a single permission by ID',
      description: 'Returns the details of a single permission by its ID.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Permission ID' }),

    SwaggerApiSuccessResponse(PermissionResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Permission retrieved successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
