/** A single field-level validation error. */
export interface FieldError {
  /** Name of the invalid field. */
  field: string;
  /** Human-readable validation error message. */
  message: string;
}
