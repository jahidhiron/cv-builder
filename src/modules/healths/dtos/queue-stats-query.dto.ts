import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class QueueStatsQueryDto {
  @ApiProperty({
    name: 'queue',
    required: false,
    description:
      'Queue name (default: cv_builder_queue). Allowed: letters, digits, dots, underscores, hyphens.',
    example: 'cv_builder_queue',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'queue must contain only letters, digits, dots, underscores, or hyphens',
  })
  queue?: string;
}
