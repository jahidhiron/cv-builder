import { UserDto } from '@/modules/users/dtos/user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @Type(() => UserDto)
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
