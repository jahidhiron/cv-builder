import { ApiProperty } from '@nestjs/swagger';

export class AssignedPermissionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  roleId!: number;

  @ApiProperty({ example: 1 })
  permissionId!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;
}

export class AssignPermissionsResponseDto {
  @ApiProperty({ type: [AssignedPermissionDto] })
  assigned!: AssignedPermissionDto[];
}
