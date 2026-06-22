import { BaseFilePipe } from '@/common/pipes/base-file.pipe';

export class AvatarFilePipe extends BaseFilePipe {
  constructor() {
    super({
      maxSize: 5 * 1024 * 1024,
      fileType: /^image\/(jpeg|png|webp)$/,
      skipMagicNumbersValidation: true,
    });
  }
}