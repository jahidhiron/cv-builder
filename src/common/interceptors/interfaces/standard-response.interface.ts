export interface StandardResponse<T = unknown> {
  success: true;
  method: string;
  status: string;
  statusCode: number;
  path: string;
  timestamp: string;
  message: string;
  data: T;
}
