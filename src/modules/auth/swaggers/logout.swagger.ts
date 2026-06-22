import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

export function LogoutSwaggerDocs() {
  const path = `${ModuleName.Auth}/logout`;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiBearerAuth(),

    ApiOperation({
      summary: 'Logout',
      description:
        'Invalidates the current session (`type=current`, default) or all active sessions across every device (`type=all`).',
    }),

    ApiQuery({
      name: 'type',
      required: false,
      enum: ['current', 'all'],
      description: 'Which sessions to invalidate. Defaults to `current`.',
    }),

    SwaggerApiSuccessResponse(null, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Logged out successfully',
    }),

    UnauthorizedResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
