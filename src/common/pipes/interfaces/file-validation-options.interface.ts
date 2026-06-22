export interface FileValidationOptions {
  maxSize: number;
  fileType: RegExp;
  /** Skip magic-number (file-type) detection; validate against the declared mimetype instead. */
  skipMagicNumbersValidation?: boolean;
}