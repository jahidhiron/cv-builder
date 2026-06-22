import { AuthUserDto } from '@/modules/auth/dtos/auth-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class SignupResponseDto {
  @Expose()
  @Type(() => AuthUserDto)
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
