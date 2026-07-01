import { SystemActivityLogDto } from '@/modules/activity-log/dtos/system-activity-log.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for the single-system-activity-log detail endpoint. */
export class SystemActivityLogDetailResponseDto {
  @ApiProperty({ type: SystemActivityLogDto })
  log!: SystemActivityLogDto;
}