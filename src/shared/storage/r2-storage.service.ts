import { ConfigService } from '@/config';
import { MulterFile, UploadResult } from '@/shared/storage/interfaces';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Thin wrapper around the AWS SDK S3Client targeting Cloudflare R2.
 *
 * Initialises the S3-compatible client on module startup using credentials
 * from {@link ConfigService.storage}. If any credential is absent the client
 * is left `null` and a warning is logged; all upload and delete operations
 * will throw until the environment is correctly configured.
 *
 * **Environment variables required:**
 * - `R2_ENDPOINT` — `https://<account-id>.r2.cloudflarestorage.com`
 * - `R2_ACCESS_KEY_ID` — R2 API token access-key ID
 * - `R2_SECRET_ACCESS_KEY` — R2 API token secret
 * - `R2_BUCKET_NAME` — target bucket name
 * - `R2_PUBLIC_BASE_URL` — public CDN base URL (e.g. `https://pub-xxx.r2.dev`)
 */
@Injectable()
export class R2StorageService implements OnModuleInit {
  private readonly logger = new Logger(R2StorageService.name);
  private client: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Initialises the S3Client on application startup.
   *
   * Logs a warning and skips initialisation if any required credential is
   * missing so the app still boots in environments where R2 is not needed.
   */
  onModuleInit() {
    const { r2Endpoint, r2AccessKeyId, r2SecretAccessKey } = this.config.storage;

    if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
      this.logger.warn(
        'R2 credentials missing (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). Uploads will fail until configured.',
      );
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
      // AWS SDK v3.726+ enables automatic CRC checksums by default.
      // Cloudflare R2 does not support the resulting chunked-encoding stream,
      // so we only compute checksums when explicitly requested.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  /**
   * Returns `true` when the client and all bucket/URL config values are
   * present. Use this as a guard before calling {@link uploadFile} or
   * {@link deleteFile} from code that should degrade gracefully.
   */
  get isConfigured(): boolean {
    const { r2BucketName, r2PublicBaseUrl } = this.config.storage;
    return !!this.client && !!r2BucketName && !!r2PublicBaseUrl;
  }

  /**
   * Uploads a file to R2 under the given `key` and returns the public URL.
   *
   * The object is stored with an immutable one-year `Cache-Control` header,
   * which is appropriate for content-addressed keys (e.g. including a
   * timestamp or hash in the key).
   *
   * @param key  - R2 object key, e.g. `users/avatars/42/1700000000000.jpg`.
   * @param file - Multer file object produced by NestJS `FileInterceptor`.
   * @returns `{ url, key }` — the full public URL and the stored object key.
   * @throws {Error} When {@link isConfigured} is `false`.
   */
  async uploadFile(key: string, file: MulterFile): Promise<UploadResult> {
    if (!this.isConfigured) throw new Error('R2 storage is not configured');

    const { r2BucketName, r2PublicBaseUrl } = this.config.storage;

    // Multer's Buffer arrives as a numeric-keyed plain object after NestJS pipeline
    // serialisation. Object.values() reconstructs the byte array in correct order.
    const body: Buffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(Object.values(file.buffer as Record<string, number>));

    await this.client!.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: body,
        ContentType: file.mimetype,
        ContentLength: body.byteLength,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const url = `${r2PublicBaseUrl.replace(/\/$/, '')}/${key}`;
    return { url, key };
  }

  /**
   * Permanently deletes the object identified by `key` from the bucket.
   *
   * R2's `DeleteObject` is idempotent — deleting a non-existent key does not
   * throw. Safe to call without a prior existence check.
   *
   * @param key - R2 object key to delete.
   * @throws {Error} When {@link isConfigured} is `false`.
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.isConfigured) throw new Error('R2 storage is not configured');

    await this.client!.send(
      new DeleteObjectCommand({ Bucket: this.config.storage.r2BucketName, Key: key }),
    );
  }

  /**
   * Extracts the R2 object key from a public URL previously produced by
   * {@link uploadFile}.
   *
   * Strips the configured `R2_PUBLIC_BASE_URL` prefix so the key can be
   * passed back to {@link deleteFile}. Falls back to returning `url` as-is
   * when the prefix does not match, making the method safe to call on
   * arbitrary strings.
   *
   * @param url - Full public URL, e.g. `https://pub-xxx.r2.dev/users/avatars/42/1700000000000.jpg`.
   * @returns The object key, e.g. `users/avatars/42/1700000000000.jpg`.
   */
  keyFromUrl(url: string): string {
    const base = this.config.storage.r2PublicBaseUrl.replace(/\/$/, '');
    return url.startsWith(base) ? url.slice(base.length + 1) : url;
  }
}
