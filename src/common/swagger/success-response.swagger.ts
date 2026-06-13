import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SwaggerResponseOptions } from './interfaces';

export function successResponse<T>(
  DataType: (new () => T) | null,
  options: SwaggerResponseOptions,
  isArray = false,
) {
  const { method, status, statusCode, message, path } = options;

  if (!DataType) {
    class NoDataResponseDto {
      @ApiProperty({ example: true }) success = true;
      @ApiProperty({ example: method }) method = method;
      @ApiProperty({ example: status }) status = status;
      @ApiProperty({ example: statusCode }) statusCode = statusCode;
      @ApiProperty({ example: path }) path = path;
      @ApiProperty({ example: new Date().toISOString() }) timestamp =
        new Date().toISOString();
      @ApiProperty({ example: message }) message = message;
    }

    Object.defineProperty(NoDataResponseDto, 'name', {
      value: `NoData_${method}_Response_${message.replace(/\s/g, '')}`,
    });

    return NoDataResponseDto;
  }

  if (!isArray) {
    class SwaggerSuccessResponseDto {
      @ApiProperty({ example: true }) success = true;
      @ApiProperty({ example: method }) method = method;
      @ApiProperty({ example: status }) status = status;
      @ApiProperty({ example: statusCode }) statusCode = statusCode;
      @ApiProperty({ example: path }) path = path;
      @ApiProperty({ example: new Date().toISOString() }) timestamp =
        new Date().toISOString();
      @ApiProperty({ example: message }) message = message;
      @ApiPropertyOptional({ type: () => DataType })
      @Type(() => DataType)
      data?: T;

      constructor(data?: T) {
        if (data) this.data = data;
      }
    }
    Object.defineProperty(SwaggerSuccessResponseDto, 'name', {
      value: `${DataType.name}_${method}_Single_${message.replace(/\s/g, '')}`,
    });
    return SwaggerSuccessResponseDto;
  }

  class SwaggerArrayResponseDto {
    @ApiProperty({ example: true }) success = true;
    @ApiProperty({ example: method }) method = method;
    @ApiProperty({ example: status }) status = status;
    @ApiProperty({ example: statusCode }) statusCode = statusCode;
    @ApiProperty({ example: path }) path = path;
    @ApiProperty({ example: new Date().toISOString() }) timestamp =
      new Date().toISOString();
    @ApiProperty({ example: message }) message = message;
    @ApiPropertyOptional({
      isArray: true,
      type: () => DataType,
      items: { $ref: getSchemaPath(DataType) },
    })
    @Type(() => DataType)
    data?: T[];

    constructor(data?: T[]) {
      if (data) this.data = data;
    }
  }

  Object.defineProperty(SwaggerArrayResponseDto, 'name', {
    value: `${DataType.name}_${method}_Array_${message.replace(/\s/g, '')}`,
  });

  return SwaggerArrayResponseDto;
}
