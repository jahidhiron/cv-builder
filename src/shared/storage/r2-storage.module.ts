import { ConfigModule } from '@/config';
import { R2StorageService } from '@/shared/storage/r2-storage.service';
import { Module } from '@nestjs/common';

/**
 * Provides {@link R2StorageService} for uploading and managing objects in
 * Cloudflare R2 object storage.
 *
 * Imports {@link ConfigModule} so {@link R2StorageService} can resolve the
 * R2 account ID, bucket name, and API credentials from the application config.
 */
@Module({
  imports: [ConfigModule],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class R2StorageModule {}
