import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { PermissionListResponseDto } from '@/modules/permissions/dtos/permission-list-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

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
