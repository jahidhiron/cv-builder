import { LogoutType } from '@/modules/auth/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class LogoutQueryDto {
  @ApiPropertyOptional({ enum: LogoutType, default: LogoutType.Current })
  @IsEnum(LogoutType)
  @IsOptional()
  type: LogoutType = LogoutType.Current;
}
