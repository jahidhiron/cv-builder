import { LogStatus } from '@/modules/activity-log/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Serialised representation of a `SystemActivityLog` entity returned by the API. */
export class SystemActivityLogDto {
  @ApiProperty({ example: 501 })
  id!: number;

  @ApiProperty({ example: '2026-07-01T09:12:03.100Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ example: 42, nullable: true })
  requestLogId!: number | null;

  @ApiProperty({ example: 'user' })
  module!: string;

  @ApiProperty({ example: 'UserService' })
  className!: string;

  @ApiProperty({ example: 'update' })
  fn!: string;

  @ApiProperty({ enum: LogStatus, example: LogStatus.Success })
  status!: LogStatus;

  @ApiPropertyOptional({ example: 45, nullable: true })
  durationMs!: number | null;

  @ApiPropertyOptional({ example: '2026-07-01T09:12:03.120Z', nullable: true })
  executedAt!: Date | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  userId!: number | null;

  @ApiPropertyOptional({ example: { id: 7, dto: { name: 'Jane Doe' } }, nullable: true })
  input!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { id: 7, name: 'Jane Doe' }, nullable: true })
  output!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  error!: string | null;
}
