# Development Guide

Everything you need to run the CV Builder API locally, manage the database, and understand the configuration system.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Database](#database)
- [Code Style](#code-style)
- [Testing](#testing)
- [Docker](#docker)

---

## Prerequisites

| Tool | Min version | Install |
|------|-------------|---------|
| Node.js | 20 | https://nodejs.org |
| pnpm | 9 | `npm i -g pnpm` |
| PostgreSQL | 14 | https://postgresql.org |
| Redis | 7 | https://redis.io |
| RabbitMQ | 3.12 | https://rabbitmq.com *(optional — set `ENABLE_RABBITMQ=false` to skip)* |

---

## Local Setup

```bash
# 1 — Clone
git clone git@github.com:jahidhiron/cv-builder.git
cd cv-builder/1-api

# 2 — Install dependencies
pnpm install

# 3 — Copy env template
cp .env.local.example .env

# 4 — Edit .env (fill in DATABASE_URL, JWT secrets, Redis, etc.)

# 5 — Create the database (if it doesn't exist yet)
createdb cv_builder          # psql CLI, or use pgAdmin / TablePlus

# 6 — Run migrations
pnpm run migration:run

# 7 — Start the dev server
pnpm run start:dev
```

Server starts at **http://localhost:8084** (or whatever `PORT` you set).  
Swagger UI: **http://localhost:8084/api**

---

## Environment Variables

Three template files are provided:

| File | Purpose |
|------|---------|
| `.env.local.example` | Local development baseline |
| `.env.docker.example` | Docker Compose stack |
| `.env.example` | Generic reference |

Copy the appropriate file to `.env` and fill in real values. The app validates all variables against a Joi schema at startup — it will refuse to start if a required variable is missing or invalid.

### Full Reference

#### App

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APPLICATION_MODE` | Yes | — | `development` \| `staging` \| `production` \| `testing` |
| `PORT` | Yes | `8080` | HTTP port |
| `API_BASE_URL` | Yes | — | Full public URL, e.g. `http://localhost:8084` |
| `CLIENT_BASE_URL` | No | `http://localhost:3000` | Frontend URL (used in email links) |
| `COMPANY_NAME` | No | `CV Builder` | Used in email templates |

#### Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes* | PostgreSQL connection string. Takes precedence over individual `PG_*` vars. Append `?sslmode=require` for cloud providers. |
| `MIGRATIONS_RUN` | No | Set `true` to auto-run pending migrations on startup |

*Alternatively set `PG_HOST`, `PG_PORT`, `PG_USERNAME`, `PG_PASSWORD`, `PG_DATABASE`.

#### JWT

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_ACCESS_SECRET` | Yes | — | Min 32 chars in production |
| `JWT_REFRESH_SECRET` | Yes | — | Min 32 chars in production |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Duration string (`15m`, `1h`, etc.) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Duration string |
| `JWT_ACCESS_EXPIRES_IN_SECONDS` | No | `900` | Same as above but in seconds (used by cookie `maxAge`) |
| `JWT_REFRESH_EXPIRES_IN_SECONDS` | No | `604800` | Same as above |
| `JWT_MAX_SESSION_DAYS` | No | `30` | Maximum session age before the cron job prunes it |
| `JWT_REMEMBER_ME_EXPIRES_IN_SECONDS` | No | `2592000` | Refresh token lifetime (seconds) when signin sets `rememberMe: true` |
| `JWT_REMEMBER_ME_MAX_SESSION_DAYS` | No | `90` | Absolute session age cap when `rememberMe: true` |

#### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | Yes | `127.0.0.1` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | — | Redis auth password |

#### Swagger

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_SWAGGER_PROTECTION` | No | `false` | Require HTTP Basic Auth on `/api` |
| `SWAGGER_USER` | If above is `true` | — | Basic auth username |
| `SWAGGER_PASSWORD` | If above is `true` | — | Basic auth password |

#### Email (Mailgun)

| Variable | Required | Description |
|----------|----------|-------------|
| `MAILGUN_API_KEY` | For email features | Mailgun API key |
| `MAILGUN_DOMAIN` | For email features | Mailgun sending domain |
| `MAILGUN_FROM_EMAIL` | No | Sender address |
| `MAILGUN_FROM_NAME` | No | Sender display name |
| `SUPPORT_EMAIL` | No | Shown in templates |

#### Google OAuth

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | For OAuth | Google Console OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Google Console OAuth client secret |

#### RabbitMQ

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_RABBITMQ` | No | `false` | Enable AMQP message queue |
| `RABBITMQ_URI` | If enabled | — | `amqp://user:pass@host:5672` |
| `RABBITMQ_QUEUE` | If enabled | — | Main queue name |
| `RABBITMQ_MANAGEMENT_UI_PORT` | No | `15672` | RabbitMQ management UI port |

#### WebSocket

| Variable | Required | Description |
|----------|----------|-------------|
| `CLIENT_SOCKET_URL` | No | Frontend URL for Socket.IO CORS |

#### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HIBP_CHECK_ENABLED` | No | `false` | Check new passwords against HaveIBeenPwned |

#### Cookie

| Variable | Required | Description |
|----------|----------|-------------|
| `COOKIE_DOMAIN` | No | Domain for auth cookies (leave blank for localhost) |

#### Cloudflare R2 Storage

| Variable | Required | Description |
|----------|----------|-------------|
| `R2_ENDPOINT` | For file upload | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | If endpoint set | R2 access key |
| `R2_SECRET_ACCESS_KEY` | If endpoint set | R2 secret key |
| `R2_BUCKET_NAME` | No | `cv-builder-assets` |
| `R2_PUBLIC_BASE_URL` | For file upload | Public URL prefix for uploaded files |

---

## Running the Server

### Development (hot reload)

```bash
pnpm run start:dev
```

Changes to `.ts` files trigger automatic recompile and restart.

### Debug mode

```bash
pnpm run start:debug
```

Attaches Node.js inspector on port 9229. Connect VS Code's debugger or Chrome DevTools.

### Production (compiled)

```bash
pnpm run build
pnpm run start
```

---

## Database

### Migrations

The project uses TypeORM migrations. Migration files live in `src/infrastructure/db/migrations/`.

```bash
# Apply all pending migrations
pnpm run migration:run

# Revert the most recent migration
pnpm run migration:revert

# Scaffold an empty migration file
pnpm run migration:create --name=add-user-phone

# Generate a migration from entity changes (compares entities to DB schema)
pnpm run migration:generate --name=add-user-phone
```

When `MIGRATIONS_RUN=true` in your `.env`, the app runs pending migrations automatically on startup. This is recommended for Docker / CI environments but should be left `false` for local development (run manually).

### Naming strategy

TypeORM is configured with `SnakeCaseNamingStrategy`. You write TypeScript in camelCase and the columns/tables use snake_case in PostgreSQL:

```ts
@Column()
firstName: string;   // → column: first_name

@Entity()
class UserProfile    // → table: user_profile
```

Never set `name:` on `@Column()` or `@Entity()` manually — the naming strategy handles it automatically.

### Schema overview

7 migrations create the full schema:

1. **RBAC** — `roles`, `permissions`, `role_permissions`
2. **Users + Auth** — `users`, `verification_tokens`, `refresh_tokens`, `login_histories`, `password_histories`
3. **Server errors** — `server_errors` (backs the `error-tracking` module)
4. **Activity logs** — `request_logs`, `user_activity_logs`, `system_activity_logs` (backs the `activity-log` module)
5. **Resume content** — `categories`, `resume_styles`, `section_types`, `profile_field_definitions`, `user_profiles`, `templates`, `resumes`, `resume_sections`
6. **Documents** — `cover_letters`, `ats_scores`, `ai_generations`, `resume_imports`, `resume_exports`
7. **Billing** — `billing_intervals`, `plans`, `plan_features`, `plan_prices`, `subscriptions`, `subscription_events`, `entitlements`

Migrations 5–7 (resume content, documents, billing) already exist in the database, but their corresponding feature modules haven't been built yet under `src/modules/`.

---

## Code Style

The project uses **ESLint** + **Prettier** with NestJS recommended rules.

```bash
pnpm run lint     # ESLint with auto-fix
pnpm run format   # Prettier formatting
```

### Key conventions

- **No fat services** — Services delegate to single-responsibility Provider classes.
- **No comments explaining WHAT** — Code should be self-describing. Comments only explain WHY (a hidden constraint, workaround, etc.).
- **No `@HttpCode()` decorators** — Use `successResponse.created()` / `ok()` etc. — the `ResponseStatusInterceptor` picks up the status code automatically.
- **i18n for all messages** — Never hardcode English strings in providers. Define them in `[module]/i18n/en.json`.
- **bigint columns are strings at runtime** — PostgreSQL `bigint` columns return as JavaScript strings via the `pg` driver. Always wrap in `Number()` when comparing against `number` values (e.g. `Number(rp.permissionId)`).

---

## Testing

```bash
pnpm run test         # Unit tests
pnpm run test:watch   # Watch mode
pnpm run test:cov     # Coverage report
pnpm run test:e2e     # E2E tests
```

Unit tests live next to their source files as `*.spec.ts` inside `src/`.

E2E tests live in `test/*.e2e-spec.ts` and use a separate Jest config (`test/jest-e2e.json`).

---

## Docker

A `docker-compose.yaml` is provided. It starts:
- **api** — the CV Builder application
- **rabbitmq** — RabbitMQ + management UI

PostgreSQL and Redis are **not** included in Docker Compose — they are expected to be cloud-hosted or running locally.

```bash
# Copy Docker env template
cp .env.docker.example .env

# Build images and start all services
pnpm run docker:up

# Stop and remove containers
pnpm run docker:down
```

The API container uses `MIGRATIONS_RUN=true` by default so the database schema is always up to date on container start.

Access points when using Docker defaults:
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/api`
- RabbitMQ Management UI: `http://localhost:15672`
