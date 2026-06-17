import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageConfigService {
  constructor(private readonly config: ConfigService) {}

  get r2Endpoint(): string { return this.config.get<string>('storage.r2Endpoint') ?? ''; }
  get r2AccessKeyId(): string { return this.config.get<string>('storage.r2AccessKeyId') ?? ''; }
  get r2SecretAccessKey(): string { return this.config.get<string>('storage.r2SecretAccessKey') ?? ''; }
  get r2BucketName(): string { return this.config.get<string>('storage.r2BucketName') ?? ''; }
  get r2PublicBaseUrl(): string { return this.config.get<string>('storage.r2PublicBaseUrl') ?? ''; }
}
