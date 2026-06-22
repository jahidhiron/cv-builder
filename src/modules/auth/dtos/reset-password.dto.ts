import { IsStrongPassword } from '@/modules/auth/decorators/is-strong-password.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Reset token from email' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  token!: string;

  @ApiProperty({ example: 'NewPassword@123', minLength: 8 })
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
