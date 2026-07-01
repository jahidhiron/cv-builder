import { MetaDto } from '@/common/base/dtos';
import { RequestLogListItemDto } from '@/modules/activity-log/dtos/request-log-list-item.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for a paginated list of request logs. */
export class RequestLogListResponseDto {
  @ApiProperty({ type: [RequestLogListItemDto] })
  items!: RequestLogListItemDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
