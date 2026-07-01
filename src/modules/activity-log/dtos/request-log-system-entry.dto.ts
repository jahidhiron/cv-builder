import { LogStatus } from '@/modules/activity-log/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** A single system activity log entry, normalized for the request-log detail view. */
export class RequestLogSystemEntryDto {
  @ApiProperty({ example: 501 })
  id!: number;

  @ApiProperty({ example: 'UserService.update', description: 'Derived from `className.fn`' })
  label!: string;

  @ApiProperty({ example: '2026-07-01T09:12:03.120Z' })
  timestamp!: Date;

  @ApiProperty({ enum: LogStatus, example: LogStatus.Success })
  status!: LogStatus;

  @ApiProperty({ example: 'user' })
  module!: string;

  @ApiProperty({ example: 'UserService' })
  className!: string;

  @ApiProperty({ example: 'update' })
  fn!: string;

  @ApiPropertyOptional({ example: 45, nullable: true })
  durationMs!: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  userId!: number | null;

  @ApiPropertyOptional({ example: { id: 7, dto: { name: 'Jane Doe' } }, nullable: true })
  input!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { id: 7, name: 'Jane Doe' }, nullable: true })
  output!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  error!: string | null;
}
