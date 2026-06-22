import { PermissionDto } from '@/modules/permissions/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

/** Response envelope containing the permissions assigned to a role. */
export class RolePermissionsResponseDto {
  @ApiProperty({ type: [PermissionDto] })
  permissions!: PermissionDto[];
}
