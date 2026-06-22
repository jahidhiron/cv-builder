import { ApiResponse } from '@nestjs/swagger';
import { successSchema } from '../builders';
import { SwaggerResponseOptions } from '../interfaces';

/**
 * Convenience decorator that combines {@link successSchema} with `@ApiResponse`.
 *
 * Apply to a controller method to document its success response in Swagger.
 *
 * @param DataType - DTO class to nest inside `data`, or `null` for data-less responses.
 * @param options  - HTTP method, status code, path, and message for the schema.
 * @param isArray  - When `true`, documents `data` as an array.
 *
 * @example
 * ```ts
 * \@SwaggerApiSuccessResponse(UserDto, { method: 'GET', status: 'OK', statusCode: 200, path: '/v1/users/:id', message: 'User retrieved.' })
 * \@Get(':id')
 * findOne(@Param('id') id: number) { … }
 * ```
 */
export function SwaggerApiSuccessResponse<T>(
  DataType: (new () => T) | null,
  options: SwaggerResponseOptions,
  isArray?: boolean,
) {
  return ApiResponse({
    status: options.statusCode,
    description: options.message,
    type: successSchema(DataType, options, isArray),
  });
}
