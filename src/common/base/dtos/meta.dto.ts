import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Pagination metadata included in every paginated list response.
 * Serialised via `SerializeInterceptor` — all fields are `@Expose()`d.
 */
export class MetaDto {
  @ApiProperty({ example: 3, description: 'Total number of items' })
  @Expose()
  total!: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  @Expose()
  pages!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  @Expose()
  currentPage!: number;
}
