import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';

/**
 * Provides {@link JwtService} — a typed wrapper around `@nestjs/jwt` that
 * pre-configures access and refresh token operations from {@link ConfigModule}.
 *
 * Registered in {@link SharedModule} with `@Global()` so every module in the
 * application can inject {@link JwtService} without importing this module directly.
 */
@Module({
  imports: [ConfigModule, NestJwtModule.register({})],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
