/** Number of random bytes used to generate the salt. OWASP recommends ≥ 16 bytes. */
export const HASH_SALT_BYTE_SIZE = 16;

/** Encoding applied when converting binary buffers to strings. */
export const HASH_ENCODING_FORMAT: BufferEncoding = 'hex';

/** Derived-key length in bytes produced by scrypt. */
export const HASH_KEY_LENGTH = 64;

/**
 * Explicit scrypt cost parameters.
 * N=32768 (2^15), r=8, p=1 matches the OWASP minimum recommendation.
 * maxmem is set to 64 MB — scrypt requires 128*N*r = 32 MB for these
 * params, and Node's default cap (32 MB) leaves no headroom.
 */
export const SCRYPT_COST_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 67108864 } as const;
