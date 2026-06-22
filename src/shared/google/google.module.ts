import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';

/**
 * Provides {@link GoogleService} — a typed wrapper around `google-auth-library`
 * for verifying Google OAuth id tokens.
 */
@Module({
  imports: [ConfigModule],
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}
