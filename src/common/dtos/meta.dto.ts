import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty({ example: 3, description: 'Total number of items' })
  @Expose()
  total: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  @Expose()
  pages: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  @Expose()
  currentPage: number;
}
