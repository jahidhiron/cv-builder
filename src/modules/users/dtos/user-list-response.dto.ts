import { MetaDto } from '@/common/dtos';
import { UserDto } from '@/modules/users/dtos/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserListResponseDto {
  @ApiProperty({ type: [UserDto] })
  items!: UserDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
