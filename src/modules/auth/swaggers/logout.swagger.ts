import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { InternalServerErrorResponse, UnauthorizedResponse } from '@/common/swagger';
import { LogoutQueryDto } from '@/modules/auth/dtos/logout-query.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

export function LogoutSwaggerDocs() {
  const path = `${ModuleName.Auth}/logout`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiBearerAuth(),

    ApiOperation({
      summary: 'Logout the current user',
      description: 'Invalidates the session. Use ?from=all to logout from all devices, or ?from=others to keep the current session.',
    }),

    ApiQuery({ name: 'from', required: false, type: String, enum: ['current', 'all', 'others'], description: 'Which sessions to invalidate' }),

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
