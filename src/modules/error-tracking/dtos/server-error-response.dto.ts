import { ServerErrorDto } from '@/modules/error-tracking/dtos/server-error.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Response envelope for single-server-error endpoints.
 *
 * Returned by the find-one and update-status actions. The outer
 * `serverError` key keeps the response shape consistent with other
 * resource envelopes in the API (see `UserResponseDto`, `RoleResponseDto`).
 */
export class ServerErrorResponseDto {
  @Expose()
  @Type(() => ServerErrorDto)
  @ApiProperty({ type: ServerErrorDto })
  serverError!: ServerErrorDto;
}
