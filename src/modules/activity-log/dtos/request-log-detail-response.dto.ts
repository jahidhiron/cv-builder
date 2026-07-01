import { RequestLogDetailDto } from '@/modules/activity-log/dtos/request-log-detail.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for the single-request-log detail endpoint. */
export class RequestLogDetailResponseDto {
  @ApiProperty({ type: RequestLogDetailDto })
  log!: RequestLogDetailDto;
}
