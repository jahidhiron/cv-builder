import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import { InternalServerErrorResponse } from '@/common/swagger';
import { AppStatusResponseDto } from '@/modules/app/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function AppStatusSwaggerDocs() {
  const path = `${ModuleName.App}/status`;
  const method = HttpMethod.GET;

  return applyDecorators(
    ApiOperation({
      summary: 'Get application status',
      description:
        'Retrieves the current status of the application, including name, version, environment, timestamp, and status message.',
    }),

    SwaggerApiSuccessResponse(AppStatusResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Application status retrieved successful',
    }),

    InternalServerErrorResponse({
      path,
      method,
    }),
  );
}
