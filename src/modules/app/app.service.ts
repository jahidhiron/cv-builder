import { ConfigService } from '@/config';
import { AppStatusDto, AppStatusResponseDto } from '@/modules/app/dtos';
import { PackageInfo } from '@/modules/app/interfaces';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  private readonly packageInfo: PackageInfo;

  constructor(private readonly configService: ConfigService) {
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      this.packageInfo = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageInfo;
    } catch {
      this.packageInfo = {};
    }
  }

  /**
   * Get application status
   * @returns Application info including name, version, environment, and timestamp
   */
  appStatus(): AppStatusResponseDto {
    const appStatus: AppStatusDto = {
      status: 'UP',
      appName: this.packageInfo.name || 'NestJS App',
      version: this.packageInfo.version || 'unknown',
      environment: this.configService.app.env,
      timestamp: new Date().toISOString(),
    };
    return { appStatus };
  }
}
