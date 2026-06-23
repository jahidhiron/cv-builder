import { MetaDto } from '@/common/base/dtos';
import { ServerErrorResponseDto } from './server-error-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Paginated response envelope for the server-error list endpoint.
 *
 * Serialised by `@Serialize` — only `@Expose()`d fields survive the
 * class-transformer pass. `items` is transformed as {@link ServerErrorResponseDto}
 * and `meta` as {@link MetaDto}.
 */
export class ServerErrorListResponseDto {
  @Expose()
  @Type(() => ServerErrorResponseDto)
  @ApiProperty({ type: [ServerErrorResponseDto] })
  items!: ServerErrorResponseDto[];

  @Expose()
  @Type(() => MetaDto)
  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
