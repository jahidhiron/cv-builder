/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from '@nestjs/common';

/**
 * Creates a partial version of any DTO class with all fields marked optional
 * and decorated with `@ApiPropertyOptional` for Swagger visibility.
 *
 * Extends NestJS `PartialType` (which already makes all fields optional and
 * copies validators) and additionally applies the Swagger decorator to each
 * property so the generated OpenAPI schema shows every field as optional.
 *
 * @param dto - The source DTO class to make partial.
 * @returns A new class that is a fully-optional, Swagger-documented version of `dto`.
 *
 * @example
 * ```ts
 * export class UpdateUserDto extends CreatePartialDto(CreateUserDto) {}
 * ```
 */
export function CreatePartialDto<T extends object>(dto: Type<T>) {
  const partial = PartialType(dto);

  const keys = Object.keys(new dto());
  for (const key of keys) {
    ApiPropertyOptional()(partial.prototype, key);
  }

  return partial;
}
