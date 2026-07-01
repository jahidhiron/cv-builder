import { UserActivityLogDto } from '@/modules/activity-log/dtos/user-activity-log.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for the single-user-activity-log detail endpoint. */
export class UserActivityLogDetailResponseDto {
  @ApiProperty({ type: UserActivityLogDto })
  log!: UserActivityLogDto;
}