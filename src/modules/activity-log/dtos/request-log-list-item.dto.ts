import { RequestLogDto } from '@/modules/activity-log/dtos/request-log.dto';
import { ApiProperty } from '@nestjs/swagger';

/** A single request-log row plus the number of correlated system/user activity log entries. */
export class RequestLogListItemDto extends RequestLogDto {
  @ApiProperty({ example: 2, description: 'Number of correlated system activity log entries' })
  systemLogCount!: number;

  @ApiProperty({ example: 1, description: 'Number of correlated user activity log entries' })
  userLogCount!: number;
}
