import { RoleDto } from '@/modules/roles/dtos/role.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope for a single role. */
export class RoleResponseDto {
  @ApiProperty({ type: RoleDto })
  role!: RoleDto;
}
