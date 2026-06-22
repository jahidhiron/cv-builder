import { MetaDto } from '@/common/base/dtos';
import { UserDto } from '@/modules/users/dtos/user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserListResponseDto {
  @Expose()
  @Type(() => UserDto)
  @ApiProperty({ type: [UserDto] })
  items!: UserDto[];

  @Expose()
  @Type(() => MetaDto)
  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
