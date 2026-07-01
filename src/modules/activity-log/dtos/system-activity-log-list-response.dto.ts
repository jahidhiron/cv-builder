import { MetaDto } from '@/common/base/dtos';
import { SystemActivityLogDto } from '@/modules/activity-log/dtos/system-activity-log.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for a paginated list of system activity logs. */
export class SystemActivityLogListResponseDto {
  @ApiProperty({ type: [SystemActivityLogDto] })
  items!: SystemActivityLogDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
