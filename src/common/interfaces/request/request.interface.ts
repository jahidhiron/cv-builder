import { UserPayload } from '@/common/interfaces/user';
import { Request } from 'express';
import { Socket } from 'net';
import { ParsedQs } from 'qs';

export interface AppRequest<
  Params = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  /** Authenticated user info, if available */
  user?: UserPayload;

  /** Client IP address */
  ip: string;

  /** Network connection */
  connection: Socket;

  /** HTTP headers */
  headers: Request['headers'] & {
    'user-agent'?: string;
  };

  /** Request protocol */
  protocol: 'http' | 'https';

  /** Is HTTPS */
  secure: boolean;

  /** Original URL of the request */
  originalUrl: string;

  /** Base URL */
  baseUrl: string;

  /** Pathname only */
  path: string;

  /** Hostname from the request */
  hostname: string;

  /** HTTP method */
  method: string;

  /** Query parameters */
  query: ReqQuery;

  /** Full request URL */
  url: string;
}
