import { BinaryLike, scrypt as _scrypt } from 'crypto';
import { SCRYPT_COST_PARAMS } from '../constants';

/**
 * Promise-based wrapper around Node's callback-style `scrypt` function.
 *
 * Uses explicit cost parameters from {@link SCRYPT_COST_PARAMS} instead of
 * relying on Node.js defaults, so cost factors are visible and auditable.
 *
 * @param password  - The value to derive a key from.
 * @param salt      - Random salt that prevents precomputation attacks.
 * @param keyLength - Desired length of the derived key in bytes.
 * @returns Buffer containing the derived key.
 */
export const scryptAsync = (
  password: BinaryLike,
  salt: BinaryLike,
  keyLength: number,
): Promise<Buffer> =>
  new Promise((resolve, reject) =>
    _scrypt(password, salt, keyLength, SCRYPT_COST_PARAMS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    }),
  );
