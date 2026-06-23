import { ServerErrorStatus } from '@/modules/error-tracking/enums/server-error-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Serialised shape of a single {@link ServerError} record returned by the API.
 *
 * Used directly by `@Serialize` on the detail and update-status endpoints —
 * each exposed field maps 1:1 to the entity column. Also used as the item
 * type inside {@link ServerErrorListResponseDto}.
 */
export class ServerErrorResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id!: number;

  @Expose()
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  fingerprint!: string;

  @Expose()
  @ApiProperty({ example: 'TypeError' })
  errorName!: string;

  @Expose()
  @ApiProperty({ example: 'Cannot read properties of undefined (reading "id")' })
  message!: string;

  @Expose()
  @ApiProperty({ example: 'GET' })
  method!: string;

  @Expose()
  @ApiProperty({ example: '/api/users/123' })
  path!: string;

  @Expose()
  @ApiPropertyOptional({ example: 'TypeError: Cannot read...\n    at Object.<anonymous>', nullable: true })
  stack!: string | null;

  @Expose()
  @ApiProperty({ enum: ServerErrorStatus, example: ServerErrorStatus.Pending })
  status!: ServerErrorStatus;

  @Expose()
  @ApiProperty({ example: 42 })
  occurrenceCount!: number;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  firstSeenAt!: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  lastSeenAt!: Date;

  @Expose()
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', nullable: true })
  emailSentAt!: Date | null;
}
