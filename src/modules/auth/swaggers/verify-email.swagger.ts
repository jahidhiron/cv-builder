import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { BadRequestResponse, InternalServerErrorResponse, NotFoundResponse } from '@/common/swagger';
import { VerifyEmailDto } from '@/modules/auth/dtos/verify-email.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function VerifyEmailSwaggerDocs() {
  const path = `${ModuleName.Auth}/verify-email`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Verify email address',
      description: 'Confirms the email verification token sent during signup or resend-verification.',
    }),

    ApiBody({ type: VerifyEmailDto }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Email verified successfully',
    }),

    BadRequestResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
