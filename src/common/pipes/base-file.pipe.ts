import { FileTypeValidator, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import type { FileValidationOptions } from './interfaces/file-validation-options.interface';

/**
 * Reusable base pipe for validating a single uploaded file.
 *
 * Extends Nest's `ParseFilePipe`, always requiring the file to be present and
 * validating both its size and mimetype. Concrete subclasses (e.g. `AvatarFilePipe`)
 * supply the specific {@link FileValidationOptions} for their use case. NestJS invokes
 * this pipe on the `@UploadedFile()` parameter of a route handler.
 */
export abstract class BaseFilePipe extends ParseFilePipe {
  /**
   * @param maxSize - Maximum allowed file size in bytes.
   * @param fileType - Regex the file's mimetype must match.
   * @param skipMagicNumbersValidation - When `true`, skips magic-number (file-signature)
   *   detection and validates against the declared mimetype instead.
   */
  constructor({ maxSize, fileType, skipMagicNumbersValidation }: FileValidationOptions) {
    super({
      fileIsRequired: true,
      validators: [
        new MaxFileSizeValidator({ maxSize }),
        new FileTypeValidator({ fileType, skipMagicNumbersValidation }),
      ],
    });
  }
}