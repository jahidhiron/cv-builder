import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPayloadDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  roleId?: number;

  @ApiPropertyOptional({ example: ['roles:create', 'roles:read'], type: [String] })
  permissions?: string[];
}
