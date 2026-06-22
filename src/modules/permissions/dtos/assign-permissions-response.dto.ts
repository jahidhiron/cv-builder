import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a single newly created role–permission assignment record.
 *
 * Reflects one row in the `role_permissions` join table that was inserted
 * as a result of the assign-permissions operation.
 */
export class AssignedPermissionDto {
  /** Unique identifier of the role–permission assignment record. */
  @ApiProperty({ example: 1 })
  id!: number;

  /** Primary key of the role that was granted the permission. */
  @ApiProperty({ example: 1 })
  roleId!: number;

  /** Primary key of the permission that was granted. */
  @ApiProperty({ example: 1 })
  permissionId!: number;

  /** ISO 8601 timestamp of when the assignment was created. */
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;
}

/**
 * Response envelope returned after assigning permissions to a role.
 *
 * Contains only the **newly** created assignments. Permission IDs that
 * were already assigned to the role are silently skipped and will not
 * appear in this list.
 */
export class AssignPermissionsResponseDto {
  /** Array of newly created role–permission assignment records. */
  @ApiProperty({ type: [AssignedPermissionDto] })
  assigned!: AssignedPermissionDto[];
}
