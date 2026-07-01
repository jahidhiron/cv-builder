import { MetaDto } from '@/common/base/dtos';
import { ServerErrorDto } from './server-error.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Paginated response envelope for the server-error list endpoint.
 *
 * Serialised by `@Serialize` — only `@Expose()`d fields survive the
 * class-transformer pass. `items` is transformed as {@link ServerErrorDto}
 * and `meta` as {@link MetaDto}.
 */
export class ServerErrorListResponseDto {
  @Expose()
  @Type(() => ServerErrorDto)
  @ApiProperty({ type: [ServerErrorDto] })
  items!: ServerErrorDto[];

  @Expose()
  @Type(() => MetaDto)
  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
