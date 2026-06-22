import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ValidateSortBy } from './decorators/validate-sort-by.decorator';
import { SortByDto } from './sort-by.dto';

/**
 * Base DTO for any paginated list endpoint.
 * Provides `q` (search), `page`, `limit`, and `sortBy` out of the box.
 * Feature list-query DTOs should extend this class and add their own filters.
 */
export class ListOptionsDto {
  @ApiPropertyOptional({ description: 'Search text' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ type: [SortByDto] })
  @ValidateSortBy(SortByDto)
  sortBy?: SortByDto[];
}
