/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from '@nestjs/common';

export function CreatePartialDto<T extends object>(dto: Type<T>) {
  const partial = PartialType(dto);

  const keys = Object.keys(new dto());
  for (const key of keys) {
    ApiPropertyOptional()(partial.prototype, key);
  }

  return partial;
}
