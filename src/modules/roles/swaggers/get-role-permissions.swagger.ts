import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { RolePermissionsResponseDto } from '@/modules/roles/dtos/role-permissions-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

/** Applies Swagger documentation decorators for the get-role-permissions endpoint. */
export function GetRolePermissionsSwaggerDocs() {
  const path = `${ModuleName.Role}/:id/permissions`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'List all permissions assigned to a role',
      description: 'Returns the full permission objects assigned to the specified role.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),

    SwaggerApiSuccessResponse(RolePermissionsResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Role permissions retrieved successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
