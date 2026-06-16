import { AppConfigService } from '@/config/app';
import appConfig from '@/config/app/app.config';
import { ConfigService } from '@/config/config.service';
import { CookieConfigService } from '@/config/cookie';
import cookieConfig from '@/config/cookie/cookie.config';
import { DbConfigService } from '@/config/db';
import dbConfig from '@/config/db/db.config';
import { envValidationSchema } from '@/config/env.validation';
import { GoogleConfigService } from '@/config/google';
import googleConfig from '@/config/google/google.config';
import { I18nLoader } from '@/config/i18n';
import { JwtConfigService } from '@/config/jwt';
import jwtConfig from '@/config/jwt/jwt.config';
import { AppLogger, createWinstonLoggerConfig } from '@/config/logger';
import { MailConfigService } from '@/config/mail';
import { mailConfig } from '@/config/mail/mail.config';
import { rabbitmqConfig, RabbitmqConfigService } from '@/config/rabbitmq';
import { realtimeConfig, RealtimeConfigService } from '@/config/realtime';
import { RedisConfigService } from '@/config/redis';
import { redisConfig } from '@/config/redis/redis.config';
import { SwaggerConfigService } from '@/config/swagger';
import swaggerConfig from '@/config/swagger/swagger.config';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { CookieResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        swaggerConfig,
        dbConfig,
        rabbitmqConfig,
        realtimeConfig,
        jwtConfig,
        googleConfig,
        redisConfig,
        mailConfig,
        cookieConfig,
      ],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nLoader,
      loaderOptions: {},
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        HeaderResolver,
        { use: CookieResolver, options: ['i18n-lang'] },
      ],
    }),

    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createWinstonLoggerConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [
    AppConfigService,
    ConfigService,
    AppLogger,
    SwaggerConfigService,
    DbConfigService,
    RabbitmqConfigService,
    RealtimeConfigService,
    JwtConfigService,
    GoogleConfigService,
    RedisConfigService,
    MailConfigService,
    CookieConfigService,
  ],
  exports: [ConfigService, AppLogger, CookieConfigService],
})
export class ConfigModule {}
