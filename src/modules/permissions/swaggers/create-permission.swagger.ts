import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ConflictResponse, InternalServerErrorResponse, UnauthorizedResponse, ForbiddenResponse } from '@/common/swagger';
import { CreatePermissionDto } from '@/modules/permissions/dtos/create-permission.dto';
import { PermissionResponseDto } from '@/modules/permissions/dtos/permission-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

/**
 * Composed Swagger decorator for the `POST /permissions` endpoint.
 *
 * Attaches the operation summary, request-body schema, 201 success response,
 * and all documented error responses (401, 403, 409, 500) to the controller action.
 *
 * @returns A NestJS `MethodDecorator` produced by `applyDecorators`.
 */
export function CreatePermissionSwaggerDocs() {
  const path = `${ModuleName.Permission}`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Create a new permission',
      description: 'Creates a new permission with a unique key. Requires permissions:create.',
    }),

    ApiBody({ type: CreatePermissionDto }),

    SwaggerApiSuccessResponse(PermissionResponseDto, {
      method,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path,
      message: 'Permission created successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    ConflictResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
