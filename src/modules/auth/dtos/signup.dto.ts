import { Sensitive } from '@/modules/activity-log/decorators';
import { IsStrongPassword } from '@/modules/auth/decorators/is-strong-password.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
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

  @Sensitive()
  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
