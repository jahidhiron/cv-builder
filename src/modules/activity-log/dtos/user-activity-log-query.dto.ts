import { ListOptionsDto } from '@/common/base/dtos/list-options.dto';
import { LogStatus } from '@/modules/activity-log/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UserActivityLogQueryDto extends ListOptionsDto {
  @ApiPropertyOptional({ enum: LogStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(LogStatus)
  status?: LogStatus;
}
