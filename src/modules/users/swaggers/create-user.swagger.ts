import { HTTP_STATUS } from '@/shared/response/constants';
import { SwaggerApiSuccessResponse } from '@/common/swagger';
import { HttpMethod } from '@/common/swagger/enums';
import { ModuleName } from '@/common/base/enums';
import {
  ConflictResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from '@/common/swagger';
import { UserResponseDto } from '@/modules/users/dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export function CreateUserSwaggerDocs() {
  const path = ModuleName.User;
  const method = HttpMethod.POST;

  return applyDecorators(
    ApiOperation({ summary: 'Create a new user (super-admin)' }),
    SwaggerApiSuccessResponse(UserResponseDto, {
      method,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path,
      message: 'User created successfully',
    }),
    UnauthorizedResponse({ path, method }),
    ForbiddenResponse({ path, method }),
    ConflictResponse({ path, method }),
    NotFoundResponse({ path, method }),
    InternalServerErrorResponse({ path, method }),
  );
}
