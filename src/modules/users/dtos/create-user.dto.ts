import { IsStrongPassword } from '@/modules/auth/decorators/is-strong-password.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 1, description: 'Role ID to assign to the new user.' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  roleId!: number;

  @ApiPropertyOptional({
    example: 'Password@123',
    minLength: 8,
    description: 'When omitted, a secure random password is generated and returned in the response.',
  })
  @IsOptional()
  @IsStrongPassword()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'When true, sends a welcome email containing the login credentials to the new user.',
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
