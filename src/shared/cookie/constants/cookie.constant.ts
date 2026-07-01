/** Static cookie attributes shared by all authentication cookies. */
export const COOKIE = {
  HTTP_ONLY: true,
  SECURE: process.env.APPLICATION_MODE === 'production',
  SAME_SITE: 'strict' as 'lax' | 'strict' | 'none',
  PATH: '/',
  REFRESH_PATH: '/v1/auth',
} as const;
