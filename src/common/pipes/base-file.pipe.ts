import { FileTypeValidator, MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import type { FileValidationOptions } from './interfaces/file-validation-options.interface';

export abstract class BaseFilePipe extends ParseFilePipe {
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