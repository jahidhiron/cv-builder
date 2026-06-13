import { DbHealthStatusDto } from '@/modules/healths/dtos/db-health-status.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class DbHealthStatusResponseDto {
  @ApiProperty({ type: () => DbHealthStatusDto })
  @Expose()
  @Type(() => DbHealthStatusDto)
  dbHealthStatus: DbHealthStatusDto;
}
