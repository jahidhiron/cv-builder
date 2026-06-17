import { RoleDto } from '@/modules/roles/dtos/role.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ type: RoleDto })
  role!: RoleDto;
}
