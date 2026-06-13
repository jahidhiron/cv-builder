import { DbHealthDto } from '@/modules/healths/dtos/db-health.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DbHealthResponseDto {
  @ApiProperty({ type: DbHealthDto })
  dbHealth!: DbHealthDto;
}
