import * as Joi from 'joi';

const isProdLike = ['production', 'staging'];

/**
 * Joi schema that validates all environment variables at application startup
 * (consumed by `ConfigModule.forRoot({ validationSchema })`).
 *
 * Key conditional rules:
 * - `DATABASE_URL` makes individual `PG_*` vars optional (cloud connection string takes precedence).
 * - `ENABLE_SWAGGER_PROTECTION=true` requires `SWAGGER_USER` and `SWAGGER_PASSWORD`.
 * - `ENABLE_RABBITMQ=true` requires `RABBITMQ_URI`.
 * - `R2_ENDPOINT` being set requires all four R2 credentials, preventing silent misconfiguration.
 */
export const envValidationSchema = Joi.object({
  APPLICATION_MODE: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(8080),

  API_BASE_URL: Joi.string().uri().default('http://localhost:8080'),

  DATABASE_URL: Joi.string().optional(),

  PG_HOST: Joi.when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.string().optional(),
    otherwise: Joi.string().default('localhost'),
  }),

  PG_PORT: Joi.when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.number().port().optional(),
    otherwise: Joi.number().port().default(5432),
  }),

  PG_USERNAME: Joi.when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  PG_PASSWORD: Joi.when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.string().optional().allow(''),
    otherwise: Joi.string().required(),
  }),

  PG_DATABASE: Joi.when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.string().optional(),
    otherwise: Joi.string().required(),
  }),

  MIGRATIONS_RUN: Joi.boolean().truthy('true').falsy('false').default(false),

  ENABLE_SWAGGER_PROTECTION: Joi.boolean().truthy('true').falsy('false').default(false),

  SWAGGER_USER: Joi.when('ENABLE_SWAGGER_PROTECTION', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),

  SWAGGER_PASSWORD: Joi.when('ENABLE_SWAGGER_PROTECTION', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),

  ENABLE_RABBITMQ: Joi.boolean().truthy('true').falsy('false').default(false),

  RABBITMQ_URI: Joi.when('ENABLE_RABBITMQ', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),

  RABBITMQ_QUEUE: Joi.string().default('cv_builder_queue'),

  RABBITMQ_MANAGEMENT_UI_PORT: Joi.number().port().default(15672),

  RABBITMQ_DEFAULT_USER: Joi.when('NODE_ENV', {
    is: Joi.valid(...isProdLike),
    then: Joi.string().optional(),
    otherwise: Joi.string().optional().allow('', null),
  }),

  RABBITMQ_DEFAULT_PASS: Joi.when('NODE_ENV', {
    is: Joi.valid(...isProdLike),
    then: Joi.string().optional(),
    otherwise: Joi.string().optional().allow('', null),
  }),

  CLIENT_SOCKET_URL: Joi.string().uri().optional().allow('', null),

  CLIENT_BASE_URL: Joi.string().uri().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: Joi.when('APPLICATION_MODE', {
    is: Joi.valid(...isProdLike),
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().required(),
  }),
  JWT_REFRESH_SECRET: Joi.when('APPLICATION_MODE', {
    is: Joi.valid(...isProdLike),
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().required(),
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  JWT_ACCESS_EXPIRES_IN_SECONDS: Joi.number().default(900),
  JWT_REFRESH_EXPIRES_IN_SECONDS: Joi.number().default(604800),
  JWT_MAX_SESSION_DAYS: Joi.number().integer().min(1).default(30),

  GOOGLE_CLIENT_ID: Joi.string().optional().allow('', null),
  GOOGLE_CLIENT_SECRET: Joi.string().optional().allow('', null),

  VERIFICATION_TOKEN_EXPIRES_MINUTES: Joi.number().default(30),
  ACCOUNT_LOCK_MINUTES: Joi.number().default(30),
  MAX_LOGIN_FAILED_ATTEMPTS: Joi.number().default(5),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow('', null),

  MAILGUN_API_KEY: Joi.string().optional().allow('', null),
  MAILGUN_DOMAIN: Joi.string().optional().allow('', null),
  MAILGUN_FROM_EMAIL: Joi.string().email().optional().allow('', null),
  MAILGUN_FROM_NAME: Joi.string().optional().allow('', null),
  SUPPORT_EMAIL: Joi.string().email().optional().allow('', null),

  // When R2_ENDPOINT is provided the remaining four vars are all required,
  // preventing silent partial misconfiguration that would fail at upload time.
  R2_ENDPOINT: Joi.string().uri().optional().allow('', null),
  R2_ACCESS_KEY_ID: Joi.when('R2_ENDPOINT', {
    is: Joi.string().uri().required(),
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),
  R2_SECRET_ACCESS_KEY: Joi.when('R2_ENDPOINT', {
    is: Joi.string().uri().required(),
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),
  R2_BUCKET_NAME: Joi.when('R2_ENDPOINT', {
    is: Joi.string().uri().required(),
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),
  R2_PUBLIC_BASE_URL: Joi.when('R2_ENDPOINT', {
    is: Joi.string().uri().required(),
    then: Joi.string().uri().required(),
    otherwise: Joi.string().optional().allow('', null),
  }),

  COOKIE_DOMAIN: Joi.string().optional().allow('', null),

  HIBP_CHECK_ENABLED: Joi.boolean().default(true),
});
