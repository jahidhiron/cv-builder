import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { BadRequestResponse, InternalServerErrorResponse, NotFoundResponse } from '@/common/swagger';
import { ForgotPasswordDto } from '@/modules/auth/dtos/forgot-password.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function ForgotPasswordSwaggerDocs() {
  const path = `${ModuleName.Auth}/forgot-password`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Request a password reset link',
      description: 'Sends a password reset email to the provided address if it belongs to an existing account.',
    }),

    ApiBody({ type: ForgotPasswordDto }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Password reset email sent successfully',
    }),

    BadRequestResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
