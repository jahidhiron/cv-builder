import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Request body for creating a new permission.
 *
 * Permission keys follow the `domain:action` convention (e.g. `users:read`)
 * and are embedded in JWTs at sign-in time, so they must be globally unique
 * and stable once assigned to roles.
 *
 * @example
 * ```json
 * {
 *   "name": "Create Role",
 *   "key": "roles:create",
 *   "description": "Allows creating a new role"
 * }
 * ```
 */
export class CreatePermissionDto {
  /** Human-readable label for the permission (max 100 characters). */
  @ApiProperty({ example: 'Create Role' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  /**
   * Unique machine-readable key in `domain:action` format.
   * Embedded in JWTs at sign-in time and evaluated by `PermissionsGuard`
   * on every guarded request without a database round-trip.
   *
   * @example 'roles:create'
   */
  @ApiProperty({ example: 'roles:create' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string;

  /** Optional human-readable description of what access this permission grants. */
  @ApiPropertyOptional({ example: 'Allows creating a new role' })
  @IsString()
  @IsOptional()
  description?: string;
}
