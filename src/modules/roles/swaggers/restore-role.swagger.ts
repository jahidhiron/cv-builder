import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { BadRequestResponse, ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { RoleResponseDto } from '@/modules/roles/dtos/role-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function RestoreRoleSwaggerDocs() {
  const path = `${ModuleName.Role}/:id/restore`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiOperation({
      summary: 'Restore a soft-deleted role',
      description: 'Restores a previously archived (soft-deleted) role back to active state.',
    }),

    ApiParam({ name: 'id', type: Number, description: 'Role ID' }),

    SwaggerApiSuccessResponse(RoleResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Role restored successfully',
    }),

    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    BadRequestResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
