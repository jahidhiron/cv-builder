import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator';

/**
 * Request body for assigning one or more permissions to a role.
 *
 * Duplicate IDs in the array are deduplicated before processing.
 * IDs already assigned to the role are silently skipped so the operation
 * is idempotent. All provided IDs must reference existing permissions.
 *
 */
export class AssignPermissionsDto {
  /**
   * Array of permission primary keys to assign to the role.
   * Must contain at least one unique positive integer ID.
   *
   */
  @ApiProperty({ example: [1, 2, 3], description: 'IDs of permissions to assign' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  permissionIds!: number[];
}
