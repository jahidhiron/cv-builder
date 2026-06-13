import { Module } from '@nestjs/common';
import { HashService } from './hash.service';

/**
 * Provides {@link HashService} for password hashing and secure token generation.
 *
 * Import this module (or rely on {@link SharedModule}) wherever password verification
 * or random-token creation is required.
 */
@Module({
  providers: [HashService],
  exports: [HashService],
})
export class HashModule {}
