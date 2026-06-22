import { ModuleName } from '@/common/base/enums';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { ErrorResponse } from '@/shared/response';
import { MulterFile, R2StorageService } from '@/shared/storage';
import { Injectable, Scope } from '@nestjs/common';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Handles avatar uploads for a user.
 *
 * Validates file size (max 5 MB) and MIME type (JPEG, PNG, WebP), then:
 * 1. Deletes the user's existing avatar from R2 (ignoring errors — stale files
 *    are acceptable if the delete silently fails).
 * 2. Uploads the new file to R2 under `users/avatars/<userId>/<timestamp>.<ext>`.
 * 3. Persists the new public URL to the user record.
 *
 * The key format is content-addressed by timestamp, so each upload produces
 * a unique key and benefits from the immutable `Cache-Control` header set by
 * `R2StorageService`.
 */
@Injectable({ scope: Scope.REQUEST })
export class UploadAvatarProvider {
  constructor(
    private readonly findOneUser: FindOneUserProvider,
    private readonly updateUser: UpdateUserProvider,
    private readonly r2Storage: R2StorageService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(userId: number, file: MulterFile): Promise<{ avatarUrl: string }> {
    if (file.size === 0) {
      await this.errorResponse.badRequest({
        module: ModuleName.User,
        key: 'upload-avatar-empty',
      });
    }

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
    if (!user)
      return await this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });

    if (user.avatarUrl) {
      const oldKey = this.r2Storage.keyFromUrl(user.avatarUrl);
      await this.r2Storage.deleteFile(oldKey);
    }

    const key = `users/avatars/${userId}/${Date.now()}.${ext}`;
    const { url } = await this.r2Storage.uploadFile(key, file);

    await this.updateUser.execute({ id: userId }, { avatarUrl: url });

    return { avatarUrl: url };
  }
}
