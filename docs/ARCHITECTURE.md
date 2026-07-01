# Architecture Guide

This document explains the internal architecture of the CV Builder API — how modules are organised, how a request flows through the system, and what patterns every developer is expected to follow.

---

## Table of Contents

- [High-Level Overview](#high-level-overview)
- [Module Hierarchy](#module-hierarchy)
- [Request Lifecycle](#request-lifecycle)
- [Layer Breakdown](#layer-breakdown)
  - [Config Layer](#config-layer)
  - [Common Layer](#common-layer)
  - [Shared Layer (Global Services)](#shared-layer-global-services)
  - [Infrastructure Layer](#infrastructure-layer)
  - [Feature Modules](#feature-modules)
- [Base Classes](#base-classes)
  - [Entities](#entities)
  - [BaseRepository](#baserepository)
- [Response Envelope](#response-envelope)
- [Logging](#logging)
- [Swagger Decorators](#swagger-decorators)
- [i18n Messages](#i18n-messages)
- [Key Patterns](#key-patterns)

---

## High-Level Overview

```
HTTP Request
    │
    ▼
Express Middleware (Helmet, CORS, cookie-parser, body-size cap)
    │
    ▼
NestJS Guards (AuthGuard → PermissionsGuard)
    │
    ▼
NestJS Interceptors (HttpLoggingInterceptor → ResponseStatusInterceptor)
    │
    ▼
NestJS Pipes (DeserializeQuery → ValidationPipe)
    │
    ▼
Controller → Service → Providers → Repositories → PostgreSQL
    │
    ▼
Response (AppResponse envelope)
    │
    ▼
GlobalExceptionFilter (on error paths)
```

---

## Module Hierarchy

```
AppModule
├── ConfigModule            (global — config services, Winston, i18n)
├── SharedModule            (global — hash, redis, mail, response, storage, …)
├── InfrastructureModule
│   ├── DatabaseModule      (TypeORM)
│   ├── RealtimeModule      (Socket.IO)
│   ├── RabbitMqModule      (AMQP)
│   └── CronModule          (@nestjs/schedule)
├── HealthModule
├── AuthModule               (imports RoleModule, UserModule, PermissionModule)
├── PermissionModule
├── UserModule
├── ErrorTrackingModule      (imports ActivityLogModule)
├── ActivityLogModule
└── AppController / AppService
```

`ConfigModule` and `SharedModule` are decorated with `@Global()` — their exports are available to every other module without explicit imports.

---

## Request Lifecycle

### 1. Express middleware (before NestJS)

Registered in `src/app.ts` via `app.use()`:

| Middleware | Purpose |
|-----------|---------|
| `json({ limit: '100kb' })` | Parse JSON bodies, cap size |
| `urlencoded({ limit: '100kb' })` | Parse form bodies |
| `cookieParser()` | Parse `Cookie` header |
| `helmet()` | Security headers (HSTS, X-Frame-Options, …) |
| `cors()` | Origin allowlist check |

### 2. Guards (authentication then authorisation)

Both registered as `APP_GUARD` in `AppModule` — they run on every route.

**`AuthGuard`** (`src/modules/auth/guards/jwt-auth.guard.ts`)

1. Reads `AUTH_TYPE_KEY` metadata from the handler / controller.
2. If `AuthType.None` — skip, allow request.
3. If `AuthType.Bearer` (default) — extract JWT from `Authorization: Bearer …` header or `accessToken` cookie.
4. Verifies the token against `JWT_ACCESS_SECRET`.
5. Attaches decoded payload to `request.user`.

**`PermissionsGuard`** (`src/modules/auth/guards/permissions.guard.ts`)

1. If `AUTH_TYPE_KEY` contains `AuthType.None` — skip (public route).
2. If `@SkipPermissions()` is present — skip.
3. If `@RequirePermissions('resource:action')` is present — use those explicit keys.
4. Otherwise derive the required permission automatically: `<controllerPath>:<httpMethod>` (e.g. `GET /users` → `users:read`).
5. Check `request.user.permissions[]` contains every required key.

### 3. Interceptors

**`HttpLoggingInterceptor`** (APP_INTERCEPTOR, outermost)

Logs one line per request after the handler resolves:
```
[2026-06-22 14:32:44] [info] [HTTP] [GET] /v1/app/status | ip=::1 → 200 | 2ms
```
On error paths, the status is derived from the `HttpException`. This means every request — success or failure — produces an HTTP summary log.

**`ResponseStatusInterceptor`** (APP_INTERCEPTOR, SharedModule)

Wraps `res.json()` before the handler runs. When NestJS calls `res.json(appResponse)`, the wrapper reads `appResponse.statusCode` and calls `res.status(appResponse.statusCode)` — so controllers never need `@HttpCode()` decorators.

### 4. Pipes

**`DeserializeQueryPipe`** — Converts query-string `"true"` / `"false"` to booleans, `"123"` to numbers before DTO binding.

**`ValidationPipe`** — Runs `class-validator` on all DTOs, collects field-level errors, and throws `BadRequestException` with an `errors[]` array.

### 5. Handler → Providers → Repository → DB

Controllers are thin — they delegate immediately to a feature service, which delegates to one or more single-responsibility **Providers**. Providers call **Repositories** (extending `BaseRepository<T>`) for all database access.

### 6. Response

Handlers return `AppResponse` objects built by `SuccessResponse.ok()` / `created()` / etc. The `ResponseStatusInterceptor` sets the correct HTTP status code.

On exceptions, `GlobalExceptionFilter` catches the error, maps it to an `AppResponse` with `success: false`, logs 5xx / 408 errors, and sends the response.

---

## Layer Breakdown

### Config Layer

**`src/config/`**

Central configuration for the entire application.

```
config/
├── config.module.ts      # Registers NestConfigModule, I18nModule, WinstonModule
├── config.service.ts     # Aggregate injectable: config.app, config.jwt, config.db, …
├── env.validation.ts     # Joi validation schema (fails fast on bad .env)
└── [domain]/             # One sub-folder per config namespace
    ├── [domain].config.ts        # registerAs('domain', () => ({…})) factory
    └── [domain].config.service.ts  # Injectable wrapper exposing typed getters
```

Inject `ConfigService` (our custom aggregate, not `@nestjs/config`'s) to access all config in one shot:

```ts
constructor(private readonly config: ConfigService) {}

const secret = this.config.jwt.accessTokenSecret;
const port = this.config.app.port;
```

### Common Layer

**`src/common/`**

Non-business utilities that are shared by all feature modules.

| Sub-folder | Contents |
|------------|----------|
| `base/entities/` | `BaseEntity`, `BaseTimestampEntity`, `BaseSoftDeleteEntity` |
| `base/repositories/` | `BaseRepository<T>` generic CRUD |
| `base/dtos/` | `ListOptionsDto` (pagination + sorting), `SortByDto`, `MetaDto` |
| `base/enums/` | `ModuleName` — string keys for i18n namespacing |
| `base/providers/` | `BaseCreateProvider`, `BaseUpdateProvider`, `BaseUpsertProvider`, `BaseDeleteProvider`, `BaseRestoreProvider`, `BaseListProvider`, `BasePaginatedListProvider`, etc. |
| `filters/` | `GlobalExceptionFilter` |
| `interceptors/` | `HttpLoggingInterceptor` |
| `middlewares/` | `setupSecurity()` (Helmet + CORS), `setupSwaggerAuth()`, `requestContextMiddleware` (opens the `AsyncLocalStorage` scope used by activity logging) |
| `pipes/` | `ValidationPipe`, `DeserializeQueryPipe`, `ParseIdPipe`, `BaseFilePipe` |
| `swagger/` | `SwaggerApiSuccessResponse`, `BadRequestResponse`, `NotFoundResponse`, etc. |
| `utils/` | `clientIp()`, `clientAgent()`, `deviceFingerprint()` |

### Shared Layer (Global Services)

**`src/shared/`** — Decorated `@Global()`, so no module needs to import `SharedModule` explicitly.

| Module | Service | Purpose |
|--------|---------|---------|
| HashModule | `HashService` | scrypt password hashing; secure random token generation |
| RedisModule | `RedisService` | ioredis typed wrapper for caching and session storage |
| MailModule | `MailService` | Mailgun transactional email with Handlebars templates |
| HttpClientModule | `HttpClientService` | Axios with automatic retry (axios-retry) |
| ResponseModule | `SuccessResponse` / `ErrorResponse` | Build `AppResponse` envelopes with i18n messages |
| ResponseModule | `ResponseStatusInterceptor` | Auto-set HTTP status codes from `AppResponse.statusCode` |
| CookieModule | `CookieService` | Write secure `HttpOnly` auth cookies |
| RateLimitModule | `RateLimitService` / `RateLimitGuard` | Redis fixed-window rate limiting |
| GoogleModule | `GoogleService` | Google OAuth token verification |
| R2StorageModule | `R2StorageService` | Cloudflare R2 (S3-compatible) file uploads |
| (singleton) | `HibpService` | Check passwords against Have I Been Pwned |

`SuccessResponse` and `ErrorResponse` are `Scope.REQUEST` — they read the active request object for method, path, and preferred language.

### Infrastructure Layer

**`src/infrastructure/`**

#### DatabaseModule

Sets up TypeORM with:
- Connection string from `DbConfigService`
- `SnakeCaseNamingStrategy` — TypeScript `camelCase` properties map to `snake_case` columns automatically
- Runs `DatabaseHealthService` at startup (throws if DB is unreachable)
- Exports `TypeOrmModule` for repository injection

#### Migration Files

All migrations are in `src/infrastructure/db/migrations/`. Run with `pnpm run migration:run`.

| File | Tables Created |
|------|---------------|
| `…001-create-rbac-schema` | `roles`, `permissions`, `role_permissions` + seed data |
| `…002-create-users-and-auth-schema` | `users`, `verification_tokens`, `refresh_tokens`, `login_histories`, `password_histories` |
| `…003-create-server-errors-schema` | `server_errors` |
| `…004-create-activity-logs-schema` | `request_logs`, `user_activity_logs`, `system_activity_logs` |
| `…005-create-resume-content-schema` | `categories`, `resume_styles`, `section_types`, `profile_field_definitions`, `user_profiles`, `templates`, `resumes`, `resume_sections` |
| `…006-create-documents-schema` | `cover_letters`, `ats_scores`, `ai_generations`, `resume_imports`, `resume_exports` |
| `…007-create-billing-schema` | `billing_intervals`, `plans`, `plan_features`, `plan_prices`, `subscriptions`, `subscription_events`, `entitlements` |

> Tables from migrations 005–007 (resume content, documents, billing) exist in the database ahead of their feature modules — those modules are not yet implemented under `src/modules/`.

#### RealtimeModule

Socket.IO gateway (`/realtime` namespace). Provides `SocketService.emitToAll()` and `SocketService.emitToUser()` for broadcasting events from any provider.

#### RabbitMqModule

AMQP connection via `amqp-connection-manager`. Only active when `ENABLE_RABBITMQ=true`.

#### CronModule

Scheduled background jobs using `@Cron()` decorators, grouped by owning domain (e.g. `cron/auth/` — `PurgeExpiredTokensProvider` runs on a schedule to delete expired refresh/verification tokens).

---

## Feature Modules

In addition to the CRUD-style modules (`auth`, `users`, `roles`, `permissions`), two cross-cutting modules ship as first-class feature modules:

- **`activity-log`** — persists `request_logs` (one row per HTTP request, via `RequestLogInterceptor` registered globally as `APP_INTERCEPTOR`), `user_activity_logs` (business actions via `ActivityLogService.logUser()`), and `system_activity_logs` (provider-level operations via the `@SystemLog()` decorator). When `ENABLE_RABBITMQ=true`, writes are batched and deferred to a RabbitMQ consumer (`LogBundleConsumer`) instead of hitting the DB inline.
- **`error-tracking`** — `GlobalExceptionFilter` reports unhandled 5xx errors here; `ErrorTrackingService` upserts a `server_errors` row (bumping an occurrence counter on repeat errors) and exposes an admin API to list/inspect/resolve/delete them, with optional email alerts.

Each feature module follows the same structure:

```
modules/[feature]/
├── [feature].module.ts       # Wires providers + repository
├── [feature].controller.ts   # Thin HTTP layer
├── [feature].service.ts      # Orchestrates providers
├── providers/                # Fine-grained single-responsibility classes
├── repositories/             # Extends BaseRepository<Entity>
├── entities/                 # TypeORM entity definitions
├── dtos/                     # Input/output DTOs
├── swaggers/                 # Custom Swagger decorator functions
├── i18n/                     # en.json (success + error messages)
└── constants/                # Field constraints, enum values
```

### Why Providers instead of fat Services?

Each provider handles one operation (e.g. `CreateUserProvider`, `UploadAvatarProvider`). This keeps classes small, testable, and replaceable. The service file is intentionally thin — it just delegates to providers:

```ts
// user.service.ts
async create(dto: CreateUserDto): Promise<AppResponse> {
  return this.createUserProvider.execute(dto);
}
```

---

## Base Classes

### Entities

Three base entity classes in `src/common/base/entities/`:

```
BaseEntity
  id: number           @PrimaryGeneratedColumn()
  createdAt: Date      @CreateDateColumn()
    │
    └── BaseTimestampEntity
          updatedAt: Date     @UpdateDateColumn()
            │
            └── BaseSoftDeleteEntity
                  isDeleted: boolean
                  deletedAt: Date | null
                  deletedBy: number | null
                  softRemove(userId?): void   ← marks as deleted
                  restore(): void             ← clears delete flags
```

**Usage guide:**
- Use `BaseEntity` for immutable append-only records (tokens, audit logs, history).
- Use `BaseTimestampEntity` for records that change but are never deleted.
- Use `BaseSoftDeleteEntity` for user-facing records that need a recycle-bin (users, roles, permissions).

### BaseRepository

`src/common/base/repositories/base.repository.ts`

Generic TypeORM repository. All feature repositories extend it:

```ts
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }
}
```

**Available methods:**

| Method | Description |
|--------|-------------|
| `create(data, manager?)` | Insert one record |
| `createMany(data[], manager?)` | Batch insert |
| `findOne(where, options?, manager?)` | Find single record |
| `update(query, data, manager?)` | Update one record |
| `updateMany(query, data, manager?)` | Update multiple records |
| `remove(query, manager?)` | Hard-delete one record |
| `removeMany(query, manager?)` | Hard-delete multiple records |
| `list(params?)` | Fetch all matching (no pagination) |
| `paginatedList(params?)` | Fetch with pagination + meta |
| `rawQuery(sql, params?, manager?)` | Execute raw SQL |

**Paginated list example:**

```ts
const result = await this.userRepo.paginatedList({
  q: 'john',                           // full-text search
  searchBy: ['firstName', 'lastName', 'email'],
  query: { isDeleted: false },         // TypeORM where conditions
  page: 1,
  limit: 20,
  sortBy: [{ whom: 'createdAt', order: 'DESC' }],
  relations: { role: true },
});
// result.items  → User[]
// result.meta   → { total, page, limit, totalPages }
```

**Transaction example:**

```ts
await this.dataSource.transaction(async (manager) => {
  const user = await this.userRepo.create({ email }, manager);
  await this.tokenRepo.create({ userId: user.id, hash }, manager);
});
```

---

## Response Envelope

Every API response (success or error) uses the same `AppResponse` shape:

```ts
interface AppResponse<T = any> {
  success: boolean;
  method: string;           // "GET", "POST", …
  status: string;           // "OK", "CREATED", "NOT_FOUND", …
  statusCode: number;       // 200, 201, 404, …
  path: string;             // Request path
  correlationId: string;    // Request ID from ActivityLogContext (AsyncLocalStorage)
  timestamp: string;        // ISO 8601
  message: string;          // i18n-resolved message
  data?: T;                 // Present on success responses with a body
  errors?: FieldError[];    // Present on validation errors
  stack?: string;           // Present in non-production on 5xx errors
}
```

**Building responses in a provider:**

```ts
// Success
return this.successResponse.created({
  module: ModuleName.User,
  key: 'create-user',   // looks up "user.success.create-user" in en.json
  ...user,              // spread into response.data
});

// Error
await this.errorResponse.conflict({
  module: ModuleName.User,
  key: 'email-already-exists',
});
// errorResponse methods throw — they never return
```

**i18n key convention:**
- Success: `{module}.success.{key}`
- Error: `{module}.error.{key}`

---

## Logging

The app uses `AppLogger` (a Winston-backed `LoggerService`) throughout.

**Log levels by environment:**

| Environment | Console level | File level |
|-------------|--------------|------------|
| development | `debug` (all messages) | `error` only |
| production | `error` only | `error` only |

**Log methods:**

```ts
this.logger.log('message', 'ContextLabel');     // info
this.logger.warn('message', 'ContextLabel');    // warn
this.logger.error('message', stack, 'Context'); // error (+ stack trace)
this.logger.debug('message', 'Context');        // debug (dev only)
this.logger.verbose('message', 'Context');      // verbose (dev only)
```

**Development console format:**
```
[2026-06-22 14:32:44] [info] [HTTP] [GET] /v1/app/status | ip=::1 → 200 | 2ms
[2026-06-22 14:32:50] [error] [ExceptionFilter] Unauthorized: Invalid credentials
    at JwtAuthGuard.canActivate …
```

Error log files rotate daily under `logs/error-YYYY-MM-DD.log.gz`, retained for 14 days.

---

## Swagger Decorators

Each controller method uses a dedicated Swagger decorator function in `[module]/swaggers/`:

```ts
@Post()
@CreateUserSwaggerDocs()
async create(@Body() dto: CreateUserDto) { … }
```

Inside that function, use the shared helpers from `src/common/swagger/`:

```ts
export function CreateUserSwaggerDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new user' }),
    ApiBody({ type: CreateUserDto }),
    SwaggerApiSuccessResponse(UserResponseDto, {
      method: HttpMethod.POST,
      status: HTTP_STATUS.CREATED.context,
      statusCode: HTTP_STATUS.CREATED.status,
      path: ModuleName.User,
      message: 'User created successfully',
    }),
    BadRequestResponse({ path: ModuleName.User, method: HttpMethod.POST }),
    ConflictResponse({ path: ModuleName.User, method: HttpMethod.POST }),
    InternalServerErrorResponse({ path: ModuleName.User, method: HttpMethod.POST }),
  );
}
```

**Available response helpers:**

| Helper | Status |
|--------|--------|
| `SwaggerApiSuccessResponse` | 200 / 201 / any 2xx |
| `BadRequestResponse` | 400 |
| `UnauthorizedResponse` | 401 |
| `ForbiddenResponse` | 403 |
| `NotFoundResponse` | 404 |
| `ConflictResponse` | 409 |
| `TooManyRequestsResponse` | 429 |
| `InternalServerErrorResponse` | 500 |
| `ServiceUnavailableResponse` | 503 |

---

## i18n Messages

Each module has an `i18n/en.json` file with this shape:

```json
{
  "success": {
    "create-user": "User created successfully",
    "update-user": "User updated successfully"
  },
  "error": {
    "user-not-found": "User not found",
    "email-already-exists": "Email address is already registered"
  }
}
```

Messages are resolved at runtime via `I18nService.translate()` using the language from the request (`x-language` header → `accept-language` header → `lang` query param → fallback `en`).

---

## Key Patterns

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Provider Pattern** | `*/providers/` | One class per operation — single responsibility, easy to test |
| **Repository Pattern** | `BaseRepository<T>` | Decouple business logic from TypeORM internals |
| **Global Module** | `SharedModule`, `ConfigModule` | Avoid import boilerplate for cross-cutting services |
| **Aggregate Config Service** | `ConfigService` | One injection point for all env config |
| **Decorator-based RBAC** | `@RequirePermissions()`, `PermissionsGuard` | Declarative access control on routes |
| **Auto Permission Discovery** | `SyncAdminPermissionsProvider` | Scans `@Permission` decorators at runtime to upsert the DB |
| **Soft Delete** | `BaseSoftDeleteEntity` | Users/roles are recoverable — never hard-deleted by default |
| **Request-Scoped Responses** | `SuccessResponse` / `ErrorResponse` | i18n language resolved per-request from headers |
| **Interceptor-based Status Codes** | `ResponseStatusInterceptor` | No `@HttpCode()` boilerplate — status comes from `AppResponse.statusCode` |
