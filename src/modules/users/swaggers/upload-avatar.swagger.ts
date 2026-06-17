import { HTTP_STATUS } from '@/common/constants';
import { SwaggerApiSuccessResponse } from '@/common/decorators';
import { HttpMethod, ModuleName } from '@/common/enums';
import { ForbiddenResponse, InternalServerErrorResponse, NotFoundResponse, UnauthorizedResponse } from '@/common/swagger';
import { UserResponseDto } from '@/modules/users/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';

export function UploadAvatarSwaggerDocs() {
  const path = `${ModuleName.User}/:id/avatar`;
  const method = HttpMethod.PATCH;

  return applyDecorators(
    ApiOperation({ summary: 'Upload user avatar' }),
    ApiParam({ name: 'id', type: Number }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['avatar'],
        properties: {
          avatar: { type: 'string', format: 'binary', description: 'Image file (jpeg, png, webp)' },
        },
      },
    }),
    SwaggerApiSuccessResponse(UserResponseDto, {
      method,
      status: HTTP_STATUS.OK.context,
      statusCode: HTTP_STATUS.OK.status,
      path,
      message: 'Avatar uploaded successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
