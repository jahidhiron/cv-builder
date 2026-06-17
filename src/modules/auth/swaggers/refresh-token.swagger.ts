import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { RefreshTokenDto } from '@/modules/auth/dtos/refresh-token.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function RefreshTokenSwaggerDocs() {
  const path = `${ModuleName.Auth}/refresh-token`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description: 'Rotates the refresh token and issues a new access token. Accepts the token via request body or the refreshToken cookie.',
    }),

    ApiBody({ type: RefreshTokenDto }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Token refreshed successfully',
    }),

    UnauthorizedResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
