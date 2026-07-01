/** Metadata key under which per-route {@link RateLimitOptions} are stored via {@link RateLimit}. */
export const RATE_LIMIT_KEY = 'rateLimit';

export const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
export const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/** Rate limit configuration for the signup endpoint. */
export const SIGNUP_RATE_LIMIT = {
  action: 'signup',
  identifiers: ['ip', 'email'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 5,
};

/** Rate limit configuration for the signin endpoint. */
export const SIGNIN_RATE_LIMIT = {
  action: 'signin',
  identifiers: ['ip', 'email'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 10,
};

/** Rate limit configuration for the Google signin endpoint. */
export const GOOGLE_SIGNIN_RATE_LIMIT = {
  action: 'google_signin',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 10,
};

/** Rate limit configuration for the refresh-token endpoint. */
export const REFRESH_TOKEN_RATE_LIMIT = {
  action: 'refresh_token',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 20,
};

/** Rate limit configuration for the verify-email endpoint. */
export const VERIFY_EMAIL_RATE_LIMIT = {
  action: 'verify_email',
  identifiers: ['ip'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 10,
};

/** Rate limit configuration for the resend-verification endpoint. */
export const RESEND_VERIFICATION_RATE_LIMIT = {
  action: 'resend_verification',
  identifiers: ['ip', 'email'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 5,
};

/** Rate limit configuration for the forgot-password endpoint. */
export const FORGOT_PASSWORD_RATE_LIMIT = {
  action: 'forgot_password',
  identifiers: ['ip', 'email'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 5,
};

/** Rate limit configuration for the reset-password endpoint. */
export const RESET_PASSWORD_RATE_LIMIT = {
  action: 'reset_password',
  identifiers: ['ip'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 5,
};

/** Rate limit configuration for the change-password endpoint. */
export const CHANGE_PASSWORD_RATE_LIMIT = {
  action: 'change_password',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 5,
};

/** Rate limit configuration for the list-sessions endpoint. */
export const LIST_SESSIONS_RATE_LIMIT = {
  action: 'list_sessions',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 30,
};

/** Rate limit configuration for the revoke-session endpoint. */
export const REVOKE_SESSION_RATE_LIMIT = {
  action: 'revoke_session',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 10,
};
