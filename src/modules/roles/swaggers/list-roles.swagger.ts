import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { RoleListResponseDto } from '@/modules/roles/dtos/role-list-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

/** Applies Swagger documentation decorators for the list-roles endpoint. */
export function ListRolesSwaggerDocs() {
  const path = `${ModuleName.Role}`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'List roles with pagination and search',
      description: 'Returns a paginated list of roles. Supports searching by name and key.',
    }),

    SwaggerApiSuccessResponse(RoleListResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Roles retrieved successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
