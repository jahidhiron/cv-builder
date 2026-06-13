import { ApiProperty } from '@nestjs/swagger';

export class AppStatusDto {
  @ApiProperty({ example: 'UP', description: 'Current application status' })
  status!: string;

  @ApiProperty({ example: '1-nestjs', description: 'Application name' })
  appName!: string;

  @ApiProperty({ example: '0.0.1', description: 'Application version' })
  version!: string;

  @ApiProperty({ example: 'development', description: 'Current environment' })
  environment!: string;

  @ApiProperty({
    example: '2025-11-19T07:31:06.911Z',
    description: 'Timestamp of the status response',
    type: String,
    format: 'date-time',
  })
  timestamp!: string;
}
