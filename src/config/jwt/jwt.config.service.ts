import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService) {}

  get accessSecret(): string {
    return this.configService.get<string>('jwt.accessSecret')!;
  }

  get refreshSecret(): string {
    return this.configService.get<string>('jwt.refreshSecret')!;
  }

  get accessExpiresIn(): string {
    return this.configService.get<string>('jwt.accessExpiresIn')!;
  }

  get refreshExpiresIn(): string {
    return this.configService.get<string>('jwt.refreshExpiresIn')!;
  }

  /** Access token lifetime in seconds */
  get accessTokenExpiredIn(): number {
    return this.configService.get<number>('jwt.accessTokenExpiredIn')!;
  }

  /** Refresh token lifetime in seconds */
  get refreshTokenExpiredIn(): number {
    return this.configService.get<number>('jwt.refreshTokenExpiredIn')!;
  }
}
