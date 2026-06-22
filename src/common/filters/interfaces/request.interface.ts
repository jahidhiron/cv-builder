import { UserPayload } from '@/modules/auth/interfaces';
import { Request } from 'express';
import { ParsedQs } from 'qs';

/**
 * Typed Express request with the authenticated user payload attached by the auth guard.
 *
 * All standard Express fields (`ip`, `method`, `url`, `headers`, etc.) are inherited
 * from `Request` and are not re-declared here.
 */
export interface AppRequest<
  Params = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  /** Authenticated user set by the auth guard. Present only on protected routes. */
  user?: UserPayload;
}
