import { QueueDto } from '@/modules/healths/dtos/queue-stats.dto';
import { ApiProperty } from '@nestjs/swagger';

export class QueueStatsResponseDto {
  @ApiProperty({
    type: QueueDto,
    description:
      'RabbitMQ queue statistics including messages, consumers, throughput, memory, and configuration',
  })
  queueStats!: QueueDto;
}
