import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { UserResponseDto } from '@/modules/users/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function GetMeSwaggerDocs() {
  const path = `${ModuleName.User}/me`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({ summary: 'Get current authenticated user' }),
    SwaggerApiSuccessResponse(UserResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Current user retrieved successfully',
    }),
    UnauthorizedResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
