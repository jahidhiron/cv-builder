import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id!: number;

  @Expose()
  @ApiProperty({ example: 1 })
  roleId!: number;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/1.jpg', nullable: true })
  avatarUrl?: string | null;

  @Expose()
  @ApiProperty({ example: true })
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
