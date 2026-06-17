import { AuthUserDto } from '@/modules/auth/dtos/auth-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SignupResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
