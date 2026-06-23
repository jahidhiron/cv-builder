import { ServerErrorStatus } from '@/modules/error-tracking/enums/server-error-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

/**
 * Request body for the `PATCH /error-tracking/:id/status` endpoint.
 *
 * Administrators use this to transition a tracked error through its
 * lifecycle states (e.g. `pending` → `in_progress` → `resolved`).
 */
export class UpdateServerErrorStatusDto {
  @ApiProperty({ enum: ServerErrorStatus, example: ServerErrorStatus.InProgress })
  @IsEnum(ServerErrorStatus)
  status!: ServerErrorStatus;
}
