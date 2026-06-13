import { PostgresConnectionStatsDto } from '@/modules/healths/dtos/postgres-connection-stats.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class DbHealthStatusDto {
  @ApiProperty({ example: 'UP', enum: ['UP', 'DOWN', 'UNKNOWN'] })
  @Expose()
  service!: string;

  @ApiProperty({ example: 'UP', enum: ['UP', 'DOWN', 'UNKNOWN'] })
  @Expose()
  database!: string;

  @ApiProperty({ example: 7, description: 'DB ping latency in milliseconds' })
  @Expose()
  db_latency_ms!: number;

  @ApiProperty({ type: PostgresConnectionStatsDto, required: false })
  @Expose()
  postgresConnections?: PostgresConnectionStatsDto;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-11-07T05:12:34.123Z',
  })
  @Expose()
  @Type(() => Date)
  timestamp!: Date;

  @ApiProperty({ required: false, example: 'ECONNREFUSED 127.0.0.1:5432' })
  @Expose()
  error?: string;
}
