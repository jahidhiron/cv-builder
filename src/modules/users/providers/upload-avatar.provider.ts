import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { UserAction } from '@/modules/users/enums/user-action.enum';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { ErrorResponse } from '@/shared/response';
import { R2StorageService } from '@/shared/storage';
import type { MulterFile } from '@/shared/storage';
import { Injectable, Scope } from '@nestjs/common';
import { ALLOWED_MIME_TYPES, MAX_AVATAR_SIZE_BYTES } from './constants';

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
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Validates and stores a new avatar for the user identified by `userId`.
   *
   * Validation order:
   * 1. Rejects empty files (size === 0).
   * 2. Rejects files exceeding {@link MAX_AVATAR_SIZE_BYTES} (5 MB).
   * 3. Rejects unsupported MIME types (only JPEG, PNG, and WebP are allowed).
   *
   * Upload sequence:
   * 1. Fetches the current user record — throws 404 when not found.
   * 2. Deletes the existing avatar from R2 when one is set (failure is
   *    silently ignored to avoid blocking the upload).
   * 3. Uploads the new file to R2 under
   *    `users/avatars/<userId>/<timestamp>.<ext>`.
   * 4. Persists the resulting public URL to the user record.
   * 5. Emits an `AvatarUploaded` activity-log entry.
   *
   * @param userId - Primary key of the user whose avatar is being replaced.
   * @param file   - The uploaded file from the multipart request.
   * @returns An object containing the new public `avatarUrl`.
   * @throws {BadRequestException} When the file is empty, too large, or has
   *         an unsupported MIME type.
   * @throws {NotFoundException}   When no user with `userId` exists.
   */
  @SystemLog(ModuleName.User)
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

    if (user.avatarUrl) {
      const oldKey = this.r2Storage.keyFromUrl(user.avatarUrl);
      await this.r2Storage.deleteFile(oldKey);
    }

    const key = `users/avatars/${userId}/${Date.now()}.${ext}`;
    const { url } = await this.r2Storage.uploadFile(key, file);

    await this.updateUser.execute({ id: userId }, { avatarUrl: url });

    this.activityLog.logUser({
      action: UserAction.AvatarUploaded,
      userId,
      metadata: { avatarUrl: url },
    });

    return { avatarUrl: url };
  }
}
