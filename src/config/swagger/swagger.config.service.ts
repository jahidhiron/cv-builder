import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `swagger.*` namespace registered by `swagger.config.ts`.
 *
 * Provides the credentials and feature flag consumed by `setupSwaggerAuth` to
 * optionally protect the Swagger UI with HTTP Basic Auth.
 */
@Injectable()
export class SwaggerConfigService {
  /**
   * @param configService - NestJS config service used to read the `swagger.*` namespace.
   */
  constructor(private readonly configService: ConfigService) {}

  /** Basic-auth username for the Swagger UI (`SWAGGER_USER`). */
  get user(): string {
    return this.configService.get<string>('swagger.user')!;
  }

  /** Basic-auth password for the Swagger UI (`SWAGGER_PASSWORD`). */
  get password(): string {
    return this.configService.get<string>('swagger.password')!;
  }

  /** Whether to require HTTP Basic Auth before serving Swagger (`ENABLE_SWAGGER_PROTECTION=true`). */
  get enableSwaggerProtection(): boolean {
    return this.configService.get<boolean>('swagger.enableSwaggerProtection')!;
  }
}
