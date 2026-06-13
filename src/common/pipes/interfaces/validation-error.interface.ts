export interface ValidationError {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}
