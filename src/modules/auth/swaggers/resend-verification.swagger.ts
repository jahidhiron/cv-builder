import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { BadRequestResponse, InternalServerErrorResponse, NotFoundResponse } from '@/common/swagger';
import { ResendVerificationDto } from '@/modules/auth/dtos/resend-verification.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function ResendVerificationSwaggerDocs() {
  const path = `${ModuleName.Auth}/resend-verification`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Resend email verification link',
      description: 'Sends a new email verification link to the given address. Fails if the email is already verified.',
    }),

    ApiBody({ type: ResendVerificationDto }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Verification email sent successfully',
    }),

    BadRequestResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
