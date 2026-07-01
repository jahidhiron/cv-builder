import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Serialised representation of a `Permission` entity returned by the API.
 *
 * Used by `SerializeInterceptor` to map the database entity to a stable
 * response shape, stripping any internal fields not intended for clients.
 */
export class PermissionDto {
  /** Unique numeric identifier of the permission record. */
  @ApiProperty({ example: 1 })
  id!: number;

  /** Human-readable label (e.g. `'Create Role'`). */
  @ApiProperty({ example: 'Create Role' })
  name!: string;

  /**
   * Machine-readable key in `domain:action` format.
   * Embedded in JWTs and evaluated by `PermissionsGuard` on each request.
   *
   */
  @ApiProperty({ example: 'roles:create' })
  key!: string;

  /** Optional description of the access this permission grants, or `null`. */
  @ApiPropertyOptional({ example: 'Allows creating new roles', nullable: true })
  description?: string | null;

  /** ID of the user who created this record, or `null` for system-seeded entries. */
  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  /** ID of the user who last updated this record, or `null`. */
  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  /** ISO 8601 timestamp of when the record was created. */
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  /** ISO 8601 timestamp of the most recent update. */
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
