import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { BadRequestResponse, ConflictResponse, InternalServerErrorResponse } from '@/common/swagger';
import { SignupDto } from '@/modules/auth/dtos/signup.dto';
import { SignupResponseDto } from '@/modules/auth/dtos/signup-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function SignupSwaggerDocs() {
  const path = `${ModuleName.Auth}/signup`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user account',
      description: 'Creates a new user account and sends a verification email. The account must be verified before signing in.',
    }),

    ApiBody({ type: SignupDto }),

    SwaggerApiSuccessResponse(SignupResponseDto, {
      method,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path,
      message: 'Account created successfully. Please verify your email.',
    }),

    BadRequestResponse({ path, method }),
    ConflictResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
