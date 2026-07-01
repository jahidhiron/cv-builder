export const AUTH_TYPE_KEY = 'authType';
export const EXPIRED_AFTER_MINUTES = 30;
export const MAX_LOGIN_FAILED_ATTEMPTS = 5;
export const ACCOUNT_LOCKED_IN_MINUTES = 30;
export const PASSWORD_HISTORY_LIMIT = 5;
export const KNOWN_DEVICE_WINDOW_DAYS = 90;

/**
 * A syntactically valid scrypt hash used as a stand-in when a sign-in attempt
 * is made for a non-existent email. Running the full scrypt derivation against
 * this dummy hash equalises response time between "user not found" and "wrong
 * password", preventing timing-based email enumeration.
 *
 * Format: <128-char hex key>:<16-char hex salt>  (matches HASH_KEY_LENGTH=64 bytes,
 * HASH_SALT_BYTE_SIZE=8 bytes, HASH_ENCODING_FORMAT='hex').
 */
export const DUMMY_PASSWORD_HASH =
  'a'.repeat(128) + ':' + 'b'.repeat(16);
