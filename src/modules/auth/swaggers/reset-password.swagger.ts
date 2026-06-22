import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { BadRequestResponse, InternalServerErrorResponse, NotFoundResponse } from '@/common/swagger';
import { ResetPasswordDto } from '@/modules/auth/dtos/reset-password.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

export function ResetPasswordSwaggerDocs() {
  const path = `${ModuleName.Auth}/reset-password`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({
      summary: 'Reset password using a token',
      description: 'Sets a new password using the token received via the forgot-password email.',
    }),

    ApiBody({ type: ResetPasswordDto }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Password reset successfully',
    }),

    BadRequestResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
