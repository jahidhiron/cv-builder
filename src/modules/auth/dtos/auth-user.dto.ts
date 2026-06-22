import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthUserDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id!: number;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 1 })
  roleId!: number;

  @Expose()
  @ApiPropertyOptional({ example: null, nullable: true })
  avatarUrl?: string | null;

  @Expose()
  @ApiProperty({ example: false })
  emailVerified!: boolean;

  @Expose()
  @ApiProperty({ example: true })
  isActive!: boolean;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
