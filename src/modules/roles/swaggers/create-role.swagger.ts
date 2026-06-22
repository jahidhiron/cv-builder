import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { ConflictResponse, ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { CreateRoleDto } from '@/modules/roles/dtos/create-role.dto';
import { RoleResponseDto } from '@/modules/roles/dtos/role-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

/** Applies Swagger documentation decorators for the create-role endpoint. */
export function CreateRoleSwaggerDocs() {
  const path = `${ModuleName.Role}`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Create a new role',
      description: 'Creates a new role with a unique key. Requires roles:create permission.',
    }),

    ApiBody({ type: CreateRoleDto }),

    SwaggerApiSuccessResponse(RoleResponseDto, {
      method,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path,
      message: 'Role created successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    ConflictResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
