import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Moderator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'moderator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  key!: string;

  @ApiPropertyOptional({ example: 'Content moderator role' })
  @IsString()
  @IsOptional()
  description?: string;
}
