import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CookieConfigService {
  constructor(private readonly configService: ConfigService) {}

  get secure(): boolean {
    return this.configService.get<boolean>('cookie.secure')!;
  }

  get sameSite(): 'lax' | 'strict' | 'none' {
    return this.configService.get<'lax' | 'strict' | 'none'>('cookie.sameSite')!;
  }

  get httpOnly(): boolean {
    return this.configService.get<boolean>('cookie.httpOnly')!;
  }

  get path(): string {
    return this.configService.get<string>('cookie.path')!;
  }

  get refreshPath(): string {
    return this.configService.get<string>('cookie.refreshPath')!;
  }

  get domain(): string | undefined {
    return this.configService.get<string | undefined>('cookie.domain');
  }
}
