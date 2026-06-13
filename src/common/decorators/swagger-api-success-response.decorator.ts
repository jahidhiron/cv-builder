import { ApiResponse } from '@nestjs/swagger';
import { successResponse } from '../swagger';
import { SwaggerResponseOptions } from '../swagger/interfaces';

export function SwaggerApiSuccessResponse<T>(
  DataType: (new () => T) | null,
  options: SwaggerResponseOptions,
  isArray?: boolean,
) {
  return ApiResponse({
    status: options.statusCode,
    description: options.message,
    type: successResponse(DataType, options, isArray),
  });
}
