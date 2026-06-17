import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Create Role' })
  name!: string;

  @ApiProperty({ example: 'roles:create' })
  key!: string;

  @ApiPropertyOptional({ example: 'Allows creating new roles', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  createdBy?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  updatedBy?: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
