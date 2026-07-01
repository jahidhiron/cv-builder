import { LogStatus } from '@/modules/activity-log/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** A single user activity log entry, normalized for the request-log detail view. */
export class RequestLogUserEntryDto {
  @ApiProperty({ example: 88 })
  id!: number;

  @ApiProperty({ example: 'ProfileUpdated', description: "The log's `action`" })
  label!: string;

  @ApiProperty({ example: '2026-07-01T09:12:03.180Z' })
  timestamp!: Date;

  @ApiProperty({ enum: LogStatus, example: LogStatus.Success })
  status!: LogStatus;

  @ApiPropertyOptional({ example: 7, nullable: true })
  userId!: number | null;

  @ApiPropertyOptional({ example: { fields: ['name'] }, nullable: true })
  metadata!: Record<string, unknown> | null;
}
