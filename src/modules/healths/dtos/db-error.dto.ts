import { ApiProperty } from '@nestjs/swagger';

export class DbErrorDto {
  @ApiProperty({ example: 'Connection refused', required: false })
  message?: string;

  @ApiProperty({ example: 'ECONNREFUSED', required: false })
  code?: string;

  @ApiProperty({ example: 'Error stack trace...', required: false })
  stack?: string;
}
