import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

/**
 * DTO representing a sorting rule for a query
 */
export class SortByDto {
  /** Column to sort by */
  @ApiPropertyOptional({ description: 'Whom to sort by' })
  @IsString()
  whom: string;

  /** Sort order: asc or desc */
  @ApiPropertyOptional({ enum: ['asc', 'ASC', 'desc', 'DESC'], description: 'Sort order' })
  @IsIn(['asc', 'ASC', 'desc', 'DESC'])
  order: 'asc' | 'desc';
}
