import { ValidateSortByOptions } from '@/common/decorators/dto/types';
import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { IsSortableColumn } from './is-sortable-column.decorator';
import { TransformToArray } from './transform-to-array.decorator';

/**
 * Common decorator for validating "sortBy" query parameters.
 * - Transforms single object or JSON string into array.
 * - Validates array of SortByDto objects.
 * - Optionally enforces allowed sortable columns.
 */
export function ValidateSortBy<TModel extends new () => any>(
  model: TModel,
  columns: string[] = [],
  opts: ValidateSortByOptions = {},
) {
  const {
    description = 'Sorting rules (array of objects)',
    example = [{ whom: 'id', order: 'asc' }],
    message = columns.length ? `Sort by must be one of: ${columns.join(', ')}` : undefined,
  } = opts;

  const decorators: PropertyDecorator[] = [
    ApiPropertyOptional({
      description,
      type: () => [model],
      example,
    }),
    IsOptional(),
    TransformToArray<InstanceType<TModel>>(),
    IsArray({ message: 'sortBy must be an array of objects' }),
    ValidateNested({ each: true }),
    Type(() => model),
  ];

  if (columns.length > 0) {
    decorators.push(IsSortableColumn(columns, { message }));
  }

  return applyDecorators(...decorators);
}
