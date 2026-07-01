import { ListOptionsDto } from '@/common/base/dtos/list-options.dto';
import { LogStatus } from '@/modules/activity-log/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SystemActivityLogQueryDto extends ListOptionsDto {
  @ApiPropertyOptional({ enum: LogStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(LogStatus)
  status?: LogStatus;

  @ApiPropertyOptional({ description: 'Filter by module name' })
  @IsOptional()
  @IsString()
  module?: string;
}
