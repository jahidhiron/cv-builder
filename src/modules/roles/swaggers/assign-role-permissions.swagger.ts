import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { AssignPermissionsDto } from '@/modules/permissions/dtos/assign-permissions.dto';
import { AssignPermissionsResponseDto } from '@/modules/permissions/dtos/assign-permissions-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

/** Applies Swagger documentation decorators for the assign-role-permissions endpoint. */
export function AssignRolePermissionsSwaggerDocs() {
  const path = `${ModuleName.Role}/:id/permissions`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Assign permissions to a role',
      description: 'Assigns one or more permissions to a role. Already-assigned permissions are silently skipped.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),
    ApiBody({ type: AssignPermissionsDto }),

    SwaggerApiSuccessResponse(AssignPermissionsResponseDto, {
      method,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path,
      message: 'Permissions assigned successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
