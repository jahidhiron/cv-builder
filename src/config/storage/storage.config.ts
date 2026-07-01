import { registerAs } from '@nestjs/config';

/**
 * Registers the `storage` config namespace with Cloudflare R2 connection
 * details and the public base URL used to serve stored objects.
 *
 * @returns Config object read from `R2_*` env vars, each defaulting to an empty string.
 */
export default registerAs('storage', () => ({
  r2Endpoint: process.env.R2_ENDPOINT ?? '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  r2BucketName: process.env.R2_BUCKET_NAME ?? '',
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
}));
