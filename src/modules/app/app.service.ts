import { ConfigService } from '@/config';
import { AppStatusDto, AppStatusResponseDto } from '@/modules/app/dtos';
import { PackageInfo } from '@/modules/app/interfaces';
import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Service providing application-level operations such as health/status reporting.
 *
 * @module App
 */
@Injectable()
export class AppService {
  /** Parsed contents of `package.json`, used to expose app name and version. */
  private readonly packageInfo: PackageInfo;

  /**
   * @param configService - Application configuration used to read the current environment.
   */
  constructor(private readonly configService: ConfigService) {
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      this.packageInfo = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageInfo;
    } catch {
      this.packageInfo = {};
    }
  }

  /**
   * Returns the current health status of the application.
   *
   * @returns An {@link AppStatusResponseDto} containing the app name, version, environment, and timestamp.
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
