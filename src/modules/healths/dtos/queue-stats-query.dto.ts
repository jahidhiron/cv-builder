import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueueStatsQueryDto {
  @ApiProperty({
    name: 'queue',
    required: false,
    description: 'Queue name (default: cv_builder_queue)',
    example: 'cv_builder_queue',
  })
  @IsOptional()
  @IsString()
  queue?: string;
}
