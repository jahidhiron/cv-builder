import { RequestLogDto } from '@/modules/activity-log/dtos/request-log.dto';
import { RequestLogSystemEntryDto } from '@/modules/activity-log/dtos/request-log-system-entry.dto';
import { RequestLogUserEntryDto } from '@/modules/activity-log/dtos/request-log-user-entry.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * A single request log plus every system and user activity log correlated
 * to it, each normalized into its own chronologically sorted array.
 */
export class RequestLogDetailDto extends RequestLogDto {
  @ApiProperty({ type: [RequestLogSystemEntryDto] })
  systemLogs!: RequestLogSystemEntryDto[];

  @ApiProperty({ type: [RequestLogUserEntryDto] })
  userLogs!: RequestLogUserEntryDto[];
}
