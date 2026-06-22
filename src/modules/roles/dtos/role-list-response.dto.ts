import { MetaDto } from '@/common/base/dtos';
import { RoleDto } from '@/modules/roles/dtos/role.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for a paginated list of roles. */
export class RoleListResponseDto {
  @ApiProperty({ type: [RoleDto] })
  items!: RoleDto[];

  @ApiProperty({ type: MetaDto })
  meta!: MetaDto;
}
