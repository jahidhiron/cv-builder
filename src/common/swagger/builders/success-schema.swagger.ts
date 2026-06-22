import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SwaggerResponseOptions } from '../interfaces';
import { applyBaseResponseProps } from './success-schema.utils';

/**
 * Generates a Swagger response DTO class at runtime that wraps the standard
 * API envelope around the given `DataType`.
 *
 * Produces three distinct shapes depending on the arguments:
 * - `DataType = null` → envelope with no `data` field (e.g. logout, delete).
 * - `isArray = false` → envelope with `data: DataType` (single object).
 * - `isArray = true`  → envelope with `data: DataType[]` (array).
 *
 * Each generated class gets a unique name so Swagger does not collapse
 * distinct response schemas into the same `$ref`.
 *
 * @param DataType - DTO class to nest inside `data`, or `null` for data-less responses.
 * @param options  - HTTP method, status code, path, and message used for `@ApiProperty` examples.
 * @param isArray  - When `true`, `data` is declared as an array.
 * @returns A dynamically-created class decorated with `@ApiProperty` metadata.
 */
export function successSchema<T>(
  DataType: (new () => T) | null,
  options: SwaggerResponseOptions,
  isArray = false,
) {
  const { method, message, path } = options;
  const sanitizedPath = path.replace(/[^a-zA-Z0-9]/g, '_');

  if (!DataType) {
    class NoDataResponseDto {}
    applyBaseResponseProps(NoDataResponseDto.prototype, options);
    Object.defineProperty(NoDataResponseDto, 'name', {
      value: `NoData_${method}_${sanitizedPath}_Response_${message.replace(/\s/g, '')}`,
    });
    return NoDataResponseDto;
  }

  if (!isArray) {
    class SingleResponseDto {
      @ApiPropertyOptional({ type: () => DataType })
      @Type(() => DataType)
      data?: T;
    }
    applyBaseResponseProps(SingleResponseDto.prototype, options);
    Object.defineProperty(SingleResponseDto, 'name', {
      value: `${DataType.name}_${method}_${sanitizedPath}_Single_${message.replace(/\s/g, '')}`,
    });
    return SingleResponseDto;
  }

  class ArrayResponseDto {
    @ApiPropertyOptional({
      isArray: true,
      type: () => DataType,
      items: { $ref: getSchemaPath(DataType) },
    })
    @Type(() => DataType)
    data?: T[];
  }
  applyBaseResponseProps(ArrayResponseDto.prototype, options);
  Object.defineProperty(ArrayResponseDto, 'name', {
    value: `${DataType.name}_${method}_${sanitizedPath}_Array_${message.replace(/\s/g, '')}`,
  });
  return ArrayResponseDto;
}
