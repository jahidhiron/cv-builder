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
