import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ValidateSortByOptions } from '../types';
import { IsSortableColumn } from './is-sortable-column.decorator';
import { TransformToArray } from './transform-to-array.decorator';

/**
 * Composite property decorator for `sortBy` query parameters.
 *
 * Applies the following decorator pipeline in order:
 * 1. `@ApiPropertyOptional` — documents the field in Swagger UI.
 * 2. `@IsOptional` — allows the property to be absent.
 * 3. `@TransformToArray` — normalises a single object or JSON string into an array.
 * 4. `@IsArray` — ensures the transformed value is an array.
 * 5. `@ValidateNested({ each: true })` + `@Type(() => model)` — validates each item
 *    as an instance of the provided DTO class (typically `SortByDto`).
 * 6. `@IsSortableColumn(columns)` — added only when `columns` is non-empty, restricting
 *    the `whom` field to the supplied allowlist.
 *
 * @param model   - DTO class to validate each array item against (e.g. `SortByDto`).
 * @param columns - Optional allowlist of sortable column names. When provided, items
 *                  with a `whom` value outside this list fail validation.
 * @param opts    - {@link ValidateSortByOptions} for Swagger description, example, and
 *                  a custom validation message.
 *
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
    ApiPropertyOptional({ description, type: () => [model], example }),
    IsOptional(),
    TransformToArray<InstanceType<TModel>>(),
    IsArray({ message: 'sortBy must be an array of objects' }),
    ValidateNested({ each: true }),
    Type(() => model),
    // Placed last so applyDecorators (which reverses) applies it first —
    // ensuring the shorthand is expanded before TransformToArray wraps the value.
    Transform(({ value }) => {
      const parse = (v: unknown): unknown => {
        if (typeof v !== 'string' || !v.includes(':')) return v;
        const colon = v.indexOf(':');
        return { whom: v.slice(0, colon), order: v.slice(colon + 1) };
      };
      if (Array.isArray(value)) return value.map(parse);
      return parse(value);
    }),
  ];

  if (columns.length > 0) {
    decorators.push(IsSortableColumn(columns, { message }));
  }

  return applyDecorators(...decorators);
}
