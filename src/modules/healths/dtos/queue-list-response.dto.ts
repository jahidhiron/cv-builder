import { QueueDto } from '@/modules/healths/dtos/queue-stats.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueueListResponseDto {
  @ApiProperty({ type: [QueueDto], description: 'List of RabbitMQ queues with their stats' })
  @Type(() => QueueDto)
  queues!: QueueDto[];
}
