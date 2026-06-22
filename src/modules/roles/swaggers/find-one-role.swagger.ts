import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { RoleResponseDto } from '@/modules/roles/dtos/role-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

/** Applies Swagger documentation decorators for the find-one-role endpoint. */
export function FindOneRoleSwaggerDocs() {
  const path = `${ModuleName.Role}/:id`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get a single role by ID',
      description: 'Returns the details of a single role by its ID.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),

    SwaggerApiSuccessResponse(RoleResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Role retrieved successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
