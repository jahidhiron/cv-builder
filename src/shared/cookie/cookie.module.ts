import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { CookieService } from './cookie.service';

/**
 * Provides {@link CookieService} for reading and writing HTTP cookies.
 *
 * Imports {@link ConfigModule} so {@link CookieService} can resolve
 * cookie settings (secure flag, domain, etc.) from the application config.
 */
@Module({
  imports: [ConfigModule],
  providers: [CookieService],
  exports: [CookieService],
})
export class CookieModule {}
