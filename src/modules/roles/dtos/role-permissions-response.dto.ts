import { PermissionDto } from '@/modules/permissions/dtos/permission.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RolePermissionsResponseDto {
  @ApiProperty({ type: [PermissionDto] })
  permissions!: PermissionDto[];
}
