import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { ConflictResponse, ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { UpdateRoleDto } from '@/modules/roles/dtos/update-role.dto';
import { RoleResponseDto } from '@/modules/roles/dtos/role-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

export function UpdateRoleSwaggerDocs() {
  const path = `${ModuleName.Role}/:id`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiOperation({
      summary: 'Update a role by ID',
      description: 'Updates the name, key, or description of a role. The key must remain unique.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),
    ApiBody({ type: UpdateRoleDto }),

    SwaggerApiSuccessResponse(RoleResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Role updated successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    ConflictResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
