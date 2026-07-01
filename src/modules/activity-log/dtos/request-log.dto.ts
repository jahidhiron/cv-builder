import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Serialised representation of a `RequestLog` entity returned by the API. */
export class RequestLogDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'b3f1c2b0-2e5a-4a8b-9b7a-1a2c3d4e5f60' })
  requestId!: string;

  @ApiProperty({ example: 'PATCH' })
  method!: string;

  @ApiProperty({ example: 'PATCH /users/7' })
  endpoint!: string;

  @ApiPropertyOptional({ example: '203.0.113.10', nullable: true })
  ip!: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', nullable: true })
  userAgent!: string | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  userId!: number | null;

  @ApiPropertyOptional({ example: { name: 'Jane Doe' }, nullable: true })
  body!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  queryParams!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { id: '7' }, nullable: true })
  pathParams!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 200, nullable: true })
  statusCode!: number | null;

  @ApiPropertyOptional({ example: 184, nullable: true })
  durationMs!: number | null;

  @ApiProperty({ example: '2026-07-01T09:12:03.100Z' })
  createdAt!: Date;
}
