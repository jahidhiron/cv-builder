export const RATE_LIMIT_KEY = 'rateLimit';

export const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;
export const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export const SIGNUP_RATE_LIMIT = {
  action: 'signup',
  identifiers: ['ip', 'email'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 5,
};

export const SIGNIN_RATE_LIMIT = {
  action: 'signin',
  identifiers: ['ip', 'email'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 10,
};

export const GOOGLE_SIGNIN_RATE_LIMIT = {
  action: 'google_signin',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 10,
};

export const REFRESH_TOKEN_RATE_LIMIT = {
  action: 'refresh_token',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 20,
};

export const VERIFY_EMAIL_RATE_LIMIT = {
  action: 'verify_email',
  identifiers: ['ip'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 10,
};

export const RESEND_VERIFICATION_RATE_LIMIT = {
  action: 'resend_verification',
  identifiers: ['ip', 'email'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 5,
};

export const FORGOT_PASSWORD_RATE_LIMIT = {
  action: 'forgot_password',
  identifiers: ['ip', 'email'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 5,
};

export const RESET_PASSWORD_RATE_LIMIT = {
  action: 'reset_password',
  identifiers: ['ip'],
  windowMs: ONE_HOUR_IN_MS,
  maxAttempts: 5,
};

export const CHANGE_PASSWORD_RATE_LIMIT = {
  action: 'change_password',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 5,
};

export const LIST_SESSIONS_RATE_LIMIT = {
  action: 'list_sessions',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 30,
};

export const REVOKE_SESSION_RATE_LIMIT = {
  action: 'revoke_session',
  identifiers: ['ip'],
  windowMs: FIFTEEN_MINUTES_IN_MS,
  maxAttempts: 10,
};
