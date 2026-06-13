/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import qs from 'qs';

/**
 * NestJS Pipe: DeserializeQuery
 *
 * Transforms and normalizes incoming query parameters from requests.
 * This pipe handles:
 * 1. Normalizing nested query strings into objects or arrays using `qs.parse`.
 * 2. Converting stringified JSON values (objects/arrays) into actual objects/arrays.
 * 3. Converting boolean-like strings ("true", "false", "1", "0") to booleans.
 * 4. Converting numeric strings into numbers.
 * 5. Recursively processing nested arrays and objects.
 * 6. Returning other string values as-is.
 * 7. Throwing `BadRequestException` if JSON parsing fails.
 *
 * @implements PipeTransform
 */
@Injectable()
export class DeserializeQuery implements PipeTransform {
  /**
   * Transforms and normalizes the incoming query parameters.
   *
   * @param value - The raw query parameters from the request.
   * @returns The normalized object with booleans, numbers, arrays, and objects converted correctly.
   * @throws {BadRequestException} If JSON parsing fails for stringified objects/arrays.
   */
  transform(value: any) {
    if (!value || typeof value !== 'object') return value;

    const normalized = qs.parse(value);

    const deepConvert = (val: any): any => {
      if (Array.isArray(val)) return val.map(deepConvert);

      if (val && typeof val === 'object') {
        const converted: any = {};
        for (const key of Object.keys(val)) {
          converted[key] = deepConvert(val[key]);
        }
        return converted;
      }

      if (typeof val === 'string') {
        const str = val.trim();

        // Boolean conversion
        if (str.toLowerCase() === 'true') return true;
        if (str.toLowerCase() === 'false') return false;

        // Numeric conversion
        if (!isNaN(Number(str)) && str !== '') return Number(str);

        // JSON conversion
        if (
          (str.startsWith('{') && str.endsWith('}')) ||
          (str.startsWith('[') && str.endsWith(']'))
        ) {
          try {
            return JSON.parse(str);
          } catch {
            throw new BadRequestException(`Invalid JSON format: ${val}`);
          }
        }

        return str;
      }

      return val;
    };

    const result: any = {};
    for (const key of Object.keys(normalized)) {
      result[key] = deepConvert(normalized[key]);
    }

    return result;
  }
}
