/** HTTP methods allowed by the global CORS policy. */
export const ALLOW_METHODS = 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS';

/** Explicit origin allow-list (checked before `ALLOWED_DOMAINS`). Populated at runtime via config. */
export const ALLOWED_ORIGINS: string[] = ['http://localhost:4000'];

/** Wildcard domain suffixes allowed for CORS (e.g. `".example.com"` allows all subdomains). */
export const ALLOWED_DOMAINS: string[] = [];
