import { LogStatus } from '@/modules/activity-log/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Serialised representation of a `UserActivityLog` entity returned by the API. */
export class UserActivityLogDto {
  @ApiProperty({ example: 88 })
  id!: number;

  @ApiProperty({ example: '2026-07-01T09:12:03.180Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ example: 7, nullable: true })
  userId!: number | null;

  @ApiPropertyOptional({ example: 42, nullable: true })
  requestLogId!: number | null;

  @ApiProperty({ example: 'ProfileUpdated' })
  action!: string;

  @ApiProperty({ enum: LogStatus, example: LogStatus.Success })
  status!: LogStatus;

  @ApiPropertyOptional({ example: { fields: ['name'] }, nullable: true })
  metadata!: Record<string, unknown> | null;
}
