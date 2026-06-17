import { MetaDto } from '@/common/dtos';
import { RoleDto } from '@/modules/roles/dtos/role.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RoleListResponseDto {
  @ApiProperty({ type: [RoleDto] })
  items!: RoleDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
