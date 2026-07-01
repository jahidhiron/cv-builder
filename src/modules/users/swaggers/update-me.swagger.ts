import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { UserResponseDto } from '@/modules/users/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function UpdateMeSwaggerDocs() {
  const path = `${ModuleName.User}/me`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiOperation({ summary: 'Update current authenticated user profile' }),
    SwaggerApiSuccessResponse(UserResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Profile updated successfully',
    }),
    UnauthorizedResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
