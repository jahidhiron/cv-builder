import { ApiProperty } from '@nestjs/swagger';

export class QueueDto {
  @ApiProperty({ example: 'email_queue' })
  queue!: string;

  @ApiProperty({ example: 150 })
  messages!: number;

  @ApiProperty({ example: 120 })
  ready!: number;

  @ApiProperty({ example: 30 })
  unacked!: number;

  @ApiProperty({ example: 5 })
  consumers!: number;

  // Throughput metrics
  @ApiProperty({ example: 55, required: false })
  publishRatePerSec?: number;

  @ApiProperty({ example: 53, required: false })
  deliverGetRatePerSec?: number;

  @ApiProperty({ example: 52, required: false })
  ackRatePerSec?: number;

  // Memory
  @ApiProperty({ example: 1048576, required: false })
  memoryBytes?: number;

  // Configuration / metadata
  @ApiProperty({ example: true, required: false })
  durable?: boolean;

  @ApiProperty({ example: false, required: false })
  exclusive?: boolean;

  @ApiProperty({ example: 240, required: false })
  idleSinceSeconds?: number;

  @ApiProperty({ example: 'classic', required: false })
  type?: string;

  // DLX
  @ApiProperty({ example: 'dlx.exchange', required: false })
  deadLetterExchange?: string;

  @ApiProperty({ example: 'dlx.routing', required: false })
  deadLetterRoutingKey?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: Date;
}
