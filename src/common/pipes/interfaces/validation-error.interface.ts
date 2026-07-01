/** Minimal shape of a class-validator validation error used for formatting. */
export interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}
