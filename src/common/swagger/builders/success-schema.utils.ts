import { ApiProperty } from '@nestjs/swagger';
import { SwaggerResponseOptions } from '../interfaces';

/**
 * Applies the 7 shared envelope properties to a response DTO prototype using
 * `@ApiProperty` metadata so Swagger renders the correct example values.
 *
 * @param proto   - Prototype of the dynamically created response DTO class.
 * @param options - HTTP method, status, statusCode, path, and message for the examples.
 */
export function applyBaseResponseProps(proto: object, options: SwaggerResponseOptions): void {
  ApiProperty({ type: Boolean, example: true })(proto, 'success');
  ApiProperty({ type: String, example: options.method })(proto, 'method');
  ApiProperty({ type: String, example: options.status })(proto, 'status');
  ApiProperty({ type: Number, example: options.statusCode })(proto, 'statusCode');
  ApiProperty({ type: String, example: options.path })(proto, 'path');
  ApiProperty({ type: String, example: new Date().toISOString() })(proto, 'timestamp');
  ApiProperty({ type: String, example: options.message })(proto, 'message');
}
