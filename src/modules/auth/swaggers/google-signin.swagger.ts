import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { BadRequestResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { GoogleSigninDto } from '@/modules/auth/dtos/google-signin.dto';
import { SigninResponseDto } from '@/modules/auth/dtos/signin-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function GoogleSigninSwaggerDocs() {
  const path = `${ModuleName.Auth}/google`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Sign in with Google',
      description: 'Authenticates or registers a user using a Google ID token. Sets access and refresh tokens as HTTP-only cookies.',
    }),

    ApiBody({ type: GoogleSigninDto }),

    SwaggerApiSuccessResponse(SigninResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Signed in successfully',
    }),

    BadRequestResponse({ path, method }),
    UnauthorizedResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
