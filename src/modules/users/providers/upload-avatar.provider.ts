import { ModuleName } from '@/common/enums';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { MulterFile, R2StorageService } from '@/shared/storage';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable({ scope: Scope.REQUEST })
export class UploadAvatarProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly findOneUser: FindOneUserProvider,
    private readonly r2Storage: R2StorageService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(userId: number, file: MulterFile): Promise<{ avatarUrl: string }> {
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      await this.errorResponse.badRequest({
        module: ModuleName.User,
        key: 'upload-avatar-too-large',
      });
    }

    const ext = ALLOWED_MIME_TYPES[file.mimetype];
    if (!ext) {
      await this.errorResponse.badRequest({
        module: ModuleName.User,
        key: 'upload-avatar-invalid-type',
      });
    }

    const user = await this.findOneUser.execute({ id: userId });

    if (user.avatarUrl) {
      const oldKey = this.r2Storage.keyFromUrl(user.avatarUrl);
      await this.r2Storage.deleteFile(oldKey).catch(() => null);
    }

    const key = `users/avatars/${userId}/${Date.now()}.${ext!}`;
    const { url } = await this.r2Storage.uploadFile(key, file);

    await this.userRepo.update({ id: userId }, { avatarUrl: url });

    return { avatarUrl: url };
  }
}
