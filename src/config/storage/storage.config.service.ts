import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `storage.*` namespace registered by `storage.config.ts`.
 *
 * All getters return an empty string rather than `undefined` so that
 * `R2StorageService.isConfigured` can use a simple truthiness check.
 */
@Injectable()
export class StorageConfigService {
  constructor(private readonly config: ConfigService) {}

  /** Cloudflare R2 S3-compatible endpoint URL (`R2_ENDPOINT`). */
  get r2Endpoint(): string { return this.config.get<string>('storage.r2Endpoint') ?? ''; }

  /** R2 API token access-key ID (`R2_ACCESS_KEY_ID`). */
  get r2AccessKeyId(): string { return this.config.get<string>('storage.r2AccessKeyId') ?? ''; }

  /** R2 API token secret access key (`R2_SECRET_ACCESS_KEY`). */
  get r2SecretAccessKey(): string { return this.config.get<string>('storage.r2SecretAccessKey') ?? ''; }

  /** Target R2 bucket name (`R2_BUCKET_NAME`). */
  get r2BucketName(): string { return this.config.get<string>('storage.r2BucketName') ?? ''; }

  /** Public CDN base URL for serving stored objects (`R2_PUBLIC_BASE_URL`). */
  get r2PublicBaseUrl(): string { return this.config.get<string>('storage.r2PublicBaseUrl') ?? ''; }
}
