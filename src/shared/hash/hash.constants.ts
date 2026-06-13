/** Number of random bytes used to generate the salt. */
export const HASH_SALT_BYTE_SIZE = 8;

/** Encoding applied when converting binary buffers to strings. */
export const HASH_ENCODING_FORMAT: BufferEncoding = 'hex';

/** Derived-key length in bytes produced by scrypt. */
export const HASH_KEY_LENGTH = 64;
