import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { PermissionListResponseDto } from '@/modules/permissions/dtos/permission-list-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

/**
 * Composed Swagger decorator for the `GET /permissions` endpoint.
 *
 * Attaches the operation summary, 200 paginated success response with a
 * {@link PermissionListResponseDto} schema, and all documented error responses
 * (401, 403, 500) to the controller action.
 *
 * @returns A NestJS `MethodDecorator` produced by `applyDecorators`.
 */
export function ListPermissionsSwaggerDocs() {
  const path = `${ModuleName.Permission}`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'List permissions with pagination and search',
      description: 'Returns a paginated list of permissions. Supports searching by name and key.',
    }),

    SwaggerApiSuccessResponse(PermissionListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Permissions retrieved successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
