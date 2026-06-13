import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleSigninDto {
  @ApiProperty({ description: 'Google ID token obtained from the frontend' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
