import { ConfigModule } from '@/config';
import { R2StorageService } from '@/shared/storage/r2-storage.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class R2StorageModule {}
