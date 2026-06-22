import { IsStrongPassword } from '@/modules/auth/decorators/is-strong-password.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword@123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  oldPassword!: string;

  @ApiProperty({ example: 'NewPassword@123', minLength: 8 })
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
