import { UserDto } from '@/modules/users/dtos/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
