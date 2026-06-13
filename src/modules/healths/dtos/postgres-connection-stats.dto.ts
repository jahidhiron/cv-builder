import { ApiProperty } from '@nestjs/swagger';

export class PostgresConnectionStatsDto {
  @ApiProperty({ example: 12, description: 'Current open connections' })
  current!: number;

  @ApiProperty({
    example: 95,
    description: 'Peak concurrent connections since stats reset',
  })
  maxUsed!: number;

  @ApiProperty({ example: 100, description: 'Configured maximum allowed connections' })
  maxAllowed!: number;
}
