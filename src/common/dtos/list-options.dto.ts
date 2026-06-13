import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ValidateSortBy } from '../decorators/dto/validate-sort-by.decorator';
import { SortByDto } from './sort-by.dto';

/**
 * DTO for querying contacts with filters, pagination, and sorting
 */
export class ListOptionsDto {
  /** Text to search */
  @ApiPropertyOptional({ description: 'Search text' })
  @IsOptional()
  @IsString()
  q?: string;

  /** Page number (default: 1) */
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  /** Number of items per page (default: 10) */
  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  /** Sorting rules */
  @ValidateSortBy(SortByDto)
  sortBy?: SortByDto[];
}
