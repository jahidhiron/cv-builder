import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { BadRequestResponse, ForbiddenResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { SigninDto } from '@/modules/auth/dtos/signin.dto';
import { SigninResponseDto } from '@/modules/auth/dtos/signin-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function SigninSwaggerDocs() {
  const path = `${ModuleName.Auth}/signin`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Sign in with email and password',
      description: 'Authenticates the user and sets access and refresh tokens as HTTP-only cookies.',
    }),

    ApiBody({ type: SigninDto }),

    SwaggerApiSuccessResponse(SigninResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Signed in successfully',
    }),

    BadRequestResponse({ path, method }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
