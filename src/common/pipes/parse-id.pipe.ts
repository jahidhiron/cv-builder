import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Parses a route-param string into a positive integer ID.
 *
 * Rejects values that would overflow PostgreSQL's `bigint` column or JavaScript's
 * safe-integer range, preventing `22003 numeric_value_out_of_range` DB errors before
 * they reach the database.
 *
 * Throws in the same structured format as the global `ValidationPipe` so clients
 * receive a consistent `{ errors: [{ field, message }] }` response.
 *
 * Replaces `ParseIntPipe` for `:id` route parameters.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1 || id > Number.MAX_SAFE_INTEGER) {
      throw new BadRequestException({
        statusCode: 400,
        status: 'BAD_REQUEST',
        message: 'Validation Error',
        errors: [{ field: 'id', message: 'Id must be a positive integer' }],
      });
    }
    return id;
  }
}
