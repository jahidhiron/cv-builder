import { BinaryLike, scrypt as _scrypt } from 'crypto';

/**
 * Promise-based wrapper around Node's callback-style `scrypt` function.
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
    _scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    }),
  );
