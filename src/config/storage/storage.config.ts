import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  r2Endpoint: process.env.R2_ENDPOINT ?? '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  r2BucketName: process.env.R2_BUCKET_NAME ?? '',
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
}));
