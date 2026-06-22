import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Request body for creating a new role. */
export class CreateRoleDto {
  @ApiProperty({ example: 'Moderator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Content moderator role' })
  @IsString()
  @IsOptional()
  description?: string;
}
