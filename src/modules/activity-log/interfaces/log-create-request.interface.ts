export interface LogCreateRequestParams {
  requestId: string;
  method: string;
  endpoint: string;
  ip: string | null;
  userAgent: string | null;
  userId: number | null;
  body: Record<string, unknown> | null;
  queryParams: Record<string, unknown> | null;
  pathParams: Record<string, unknown> | null;
  statusCode: number | null;
  durationMs: number | null;
}
