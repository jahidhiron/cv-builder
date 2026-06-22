import { UserPayloadDto } from '@/modules/auth/dtos/user-payload.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SigninResponseDto {
  @ApiProperty({ type: UserPayloadDto })
  user!: UserPayloadDto;
}
