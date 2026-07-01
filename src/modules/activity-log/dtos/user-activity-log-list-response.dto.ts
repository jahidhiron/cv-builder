import { MetaDto } from '@/common/base/dtos';
import { UserActivityLogDto } from '@/modules/activity-log/dtos/user-activity-log.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for a paginated list of user activity logs. */
export class UserActivityLogListResponseDto {
  @ApiProperty({ type: [UserActivityLogDto] })
  items!: UserActivityLogDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
