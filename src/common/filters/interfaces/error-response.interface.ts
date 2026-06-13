import { FieldError } from './error-field.interface';

export interface ErrorResponse {
  success: boolean;
  method: string;
  status: string;
  statusCode: number;
  path: string;
  message: string;
  timestamp: string;
  errors?: FieldError[];
  stack?: string;
}
