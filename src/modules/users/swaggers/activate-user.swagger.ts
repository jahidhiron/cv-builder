import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { UserResponseDto } from '@/modules/users/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

export function ActivateUserSwaggerDocs() {
  const path = `${ModuleName.User}/:id/activate`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiOperation({ summary: 'Activate user account by ID' }),
    ApiParam({ name: 'id', type: Number }),
    SwaggerApiSuccessResponse(UserResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'User activated successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
