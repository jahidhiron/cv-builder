import { DbErrorDto } from '@/modules/healths/dtos/db-error.dto';
import { PostgresConnectionStatsDto } from '@/modules/healths/dtos/postgres-connection-stats.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DbHealthDto {
  @ApiProperty({ example: 'UP', enum: ['UP', 'DOWN', 'UNKNOWN'] })
  service!: 'UP' | 'DOWN' | 'UNKNOWN';

  @ApiProperty({ example: 'UP', enum: ['UP', 'DOWN', 'UNKNOWN'] })
  database!: 'UP' | 'DOWN' | 'UNKNOWN';

  @ApiProperty({ example: 7, description: 'DB ping latency in milliseconds' })
  dbLatencyMs!: number;

  @ApiProperty({
    example: 'PostgreSQL 16.3 on x86_64-pc-linux-gnu',
    required: false,
    description: 'PostgreSQL version string',
  })
  dbVersion?: string;

  @ApiProperty({ example: 3600, required: false, description: 'DB uptime in seconds' })
  dbUptimeSeconds?: number;

  @ApiProperty({ example: 3, required: false, description: 'Current active backend processes' })
  threadsRunning?: number;

  @ApiProperty({ example: 120, required: false, description: 'Estimated queries per second' })
  queriesPerSecond?: number;

  @ApiProperty({ type: String, format: 'date-time' })
  @Type(() => Date)
  timestamp!: Date;

  @ApiProperty({ type: PostgresConnectionStatsDto, required: false })
  postgresConnections?: PostgresConnectionStatsDto;

  @ApiProperty({ type: DbErrorDto, required: false, description: 'DB error occurred' })
  dbError?: DbErrorDto;
}
