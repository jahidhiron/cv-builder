import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { BadRequestResponse, InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { ChangePasswordDto } from '@/modules/auth/dtos/change-password.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

export function ChangePasswordSwaggerDocs() {
  const path = `${ModuleName.Auth}/change-password`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiBearerAuth(),

    ApiOperation({
      summary: 'Change current user password',
      description: 'Updates the authenticated user\'s password. Requires the current password for verification.',
    }),

    ApiBody({ type: ChangePasswordDto }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Password changed successfully',
    }),

    BadRequestResponse({ path, method }),
    UnauthorizedResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
