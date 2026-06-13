import { AppStatusDto } from '@/modules/app/dtos/app-status.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AppStatusResponseDto {
  @ApiProperty({
    type: AppStatusDto,
    description:
      'Current application status including name, version, environment, timestamp, and message',
  })
  appStatus!: AppStatusDto;
}
