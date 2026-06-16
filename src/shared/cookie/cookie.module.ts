import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { CookieService } from './cookie.service';

@Module({
  imports: [ConfigModule],
  providers: [CookieService],
  exports: [CookieService],
})
export class CookieModule {}
