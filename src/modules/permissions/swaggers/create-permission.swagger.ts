import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { ConflictResponse, InternalServerErrorResponse, UnauthorizedResponse, ForbiddenResponse } from '@/common/swagger';
import { CreatePermissionDto } from '@/modules/permissions/dtos/create-permission.dto';
import { PermissionResponseDto } from '@/modules/permissions/dtos/permission-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

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
