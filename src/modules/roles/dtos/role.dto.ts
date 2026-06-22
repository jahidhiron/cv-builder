import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Full representation of a role as returned by the API. */
export class RoleDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Admin' })
  name!: string;

  @ApiPropertyOptional({ example: 'Administrator role', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: false })
  isDeleted!: boolean;

  @ApiPropertyOptional({ example: null, nullable: true })
  deletedAt?: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  deletedBy?: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
