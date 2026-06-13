import { ALLOWED_DOMAINS, ALLOWED_ORIGINS } from '@/common/constants';

/**
 * Checks whether a given origin is permitted under the application's CORS policy.
 *
 * This function is used to validate the `Origin` header of incoming requests.
 * It allows requests from:
 * - Explicitly whitelisted origins (listed in {@link ALLOWED_ORIGINS})
 * - Any origin ending with one of the trusted domains (listed in {@link ALLOWED_DOMAINS})
 * - Requests without an `Origin` header (e.g., from mobile apps, curl, or Postman)
 *
 * @param {string | undefined} origin - The origin of the incoming request, usually extracted from the `Origin` HTTP header.
 * @returns {boolean} `true` if the origin is allowed, otherwise `false`.
 *
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;

  const normalizedOrigin = origin.toLowerCase();
  const origins = [...ALLOWED_ORIGINS, process.env.API_BASE_URL];

  if (origins.includes(normalizedOrigin)) return true;
  return ALLOWED_DOMAINS.some((domain) => normalizedOrigin.endsWith(domain));
}
