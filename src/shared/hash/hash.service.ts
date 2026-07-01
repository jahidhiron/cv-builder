import { Injectable } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { HASH_ENCODING_FORMAT, HASH_KEY_LENGTH, HASH_SALT_BYTE_SIZE } from './constants';
import { scryptAsync } from './utils';

/**
 * Provides cryptographic helpers for password hashing and secure token generation.
 *
 * Passwords are hashed with **scrypt** (memory-hard, resistant to GPU/ASIC brute-force).
 * The resulting string is self-contained: `<hash>:<salt>`, so no separate salt column
 * is needed in the database.
 */
@Injectable()
export class HashService {
  private readonly byteSize: number = HASH_SALT_BYTE_SIZE;
  private readonly format: BufferEncoding = HASH_ENCODING_FORMAT;
  private readonly keyLength: number = HASH_KEY_LENGTH;

  /**
   * Hash a plain-text password with a random salt using scrypt.
   *
   * @param password - Plain-text value to hash.
   * @returns A `"<derivedKey>:<salt>"` string ready to persist in the database.
   */
  async createHash(password: string): Promise<string> {
    const salt = randomBytes(this.byteSize).toString(this.format);
    const buf = await scryptAsync(password, salt, this.keyLength);
    return `${buf.toString(this.format)}:${salt}`;
  }

  /**
   * Verify a plain-text password against a stored hash.
   *
   * Extracts the salt from the stored value, re-derives the key, and performs
   * a constant-time comparison to prevent timing attacks.
   *
   * @param stored   - The persisted `"<hash>:<salt>"` string from the database.
   * @param supplied - The plain-text password provided by the user.
   * @returns `true` if the password matches, `false` otherwise (including on error).
   */
  async verify(stored: string, supplied: string): Promise<boolean> {
    try {
      const idx = stored.lastIndexOf(':');
      if (idx <= 0) return false;

      const hashed = stored.substring(0, idx);
      const salt = stored.substring(idx + 1);

      const buf = await scryptAsync(supplied, salt, this.keyLength);
      const derived = buf.toString(this.format);
      if (derived.length !== hashed.length) return false;
      return timingSafeEqual(Buffer.from(derived), Buffer.from(hashed));
    } catch {
      return false;
    }
  }

  /**
   * Generate a cryptographically secure random token encoded as a hex string.
   *
   * Suitable for email-verification links, password-reset tokens, and API keys.
   *
   * @param length - Number of random bytes before hex encoding. Defaults to `32`
   *                 (producing a 64-character hex string).
   * @returns Hex-encoded random token.
   */
  generateToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }
}
