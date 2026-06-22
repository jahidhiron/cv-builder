# CV Builder API

[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

A production-grade REST API for a CV/resume building platform. Built with **NestJS 11**, **PostgreSQL**, **TypeORM**, **Redis**, **RabbitMQ**, and **Socket.IO**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [API Documentation](#api-documentation)
- [Detailed Guides](#detailed-guides)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication** — JWT access/refresh tokens, Google OAuth, email verification, password reset, multi-session tracking
- **RBAC** — Role-based access control with fine-grained permissions, auto-discovered from controller decorators
- **User Management** — Full CRUD, soft-delete/restore, avatar upload to Cloudflare R2
- **Real-time** — Socket.IO WebSocket gateway for live updates
- **Async Messaging** — RabbitMQ producers/consumers for decoupled background processing
- **Cron Jobs** — Scheduled tasks for token cleanup and session enforcement
- **Structured Logging** — Winston with daily-rotating file transport and per-request HTTP logs
- **i18n** — Multi-language support via `nestjs-i18n` (header, cookie, and query-param resolution)
- **Swagger** — Auto-generated interactive API docs with optional Basic Auth protection
- **Rate Limiting** — Redis fixed-window rate limiting per route
- **Security** — Helmet headers, CORS origin allowlist, bcrypt/scrypt hashing, HIBP breach checks

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| Database | PostgreSQL + TypeORM 0.3 |
| Cache / Rate Limit | Redis (ioredis) |
| Auth | JWT (`@nestjs/jwt`) + Google OAuth |
| Messaging | RabbitMQ (amqplib) |
| Real-time | Socket.IO 4 |
| File Storage | Cloudflare R2 (S3-compatible) |
| Email | Mailgun |
| Logging | Winston + `nest-winston` |
| Validation | `class-validator` + `class-transformer` |
| API Docs | Swagger (`@nestjs/swagger`) |
| Scheduling | `@nestjs/schedule` |
| i18n | `nestjs-i18n` |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+
- Redis 7+

### 1. Clone and install

```bash
git clone git@github.com:jahidhiron/cv-builder.git
cd cv-builder/1-api
pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env
```

Edit `.env` with your local values. Minimum required:

```env
APPLICATION_MODE=development
PORT=8084
DATABASE_URL=postgresql://postgres:password@localhost:5432/cv_builder
JWT_ACCESS_SECRET=your-32-char-minimum-access-secret
JWT_REFRESH_SECRET=your-32-char-minimum-refresh-secret
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for the full environment variable reference.

### 3. Run migrations

```bash
pnpm run migration:run
```

### 4. Start in development mode

```bash
pnpm run start:dev
```

The server starts on `http://localhost:8084`.  
Swagger UI is available at `http://localhost:8084/api`.

### Using Docker

```bash
cp .env.docker.example .env
pnpm run docker:up   # build + start (API + RabbitMQ)
pnpm run docker:down # stop + remove
```

---

## Project Structure

```
src/
├── main.ts                    # Entry point — bootstrap + error handling
├── app.ts                     # NestJS factory (security, versioning, pipes, filters)
│
├── config/                    # Environment configuration layer
│   ├── config.module.ts       # Loads all config namespaces globally
│   ├── config.service.ts      # Aggregate injectable (app, jwt, db, redis, …)
│   ├── env.validation.ts      # Joi schema — validates .env at startup
│   ├── app/                   # Port, mode, base URLs
│   ├── db/                    # PostgreSQL connection
│   ├── jwt/                   # Secrets + expiry times
│   ├── redis/                 # Redis host/port/password
│   ├── mail/                  # Mailgun credentials
│   ├── cors/                  # CORS origin allowlist
│   ├── logger/                # Winston config + AppLogger service
│   ├── storage/               # Cloudflare R2 (S3) credentials
│   ├── rabbitmq/              # AMQP URI + queue names
│   ├── realtime/              # Socket.IO CORS
│   ├── google/                # OAuth client ID/secret
│   ├── cookie/                # Cookie domain + secure flag
│   └── swagger/               # OpenAPI doc settings
│
├── common/                    # Cross-cutting utilities
│   ├── base/
│   │   ├── entities/          # BaseEntity, BaseTimestampEntity, BaseSoftDeleteEntity
│   │   ├── repositories/      # BaseRepository<T> — generic CRUD + pagination
│   │   ├── dtos/              # ListOptionsDto, SortByDto, MetaDto
│   │   └── enums/             # ModuleName enum
│   ├── filters/               # GlobalExceptionFilter
│   ├── interceptors/          # HttpLoggingInterceptor, SerializeInterceptor
│   ├── middlewares/           # Helmet + CORS (setupSecurity), Swagger auth
│   ├── pipes/                 # ValidationPipe, DeserializeQueryPipe, ParseIdPipe
│   ├── swagger/               # Reusable Swagger builders + decorators
│   └── utils/                 # clientIp, deviceFingerprint helpers
│
├── modules/                   # Feature modules
│   ├── app/                   # Root controller (GET /app/status)
│   ├── auth/                  # JWT auth, OAuth, email verification, sessions
│   ├── users/                 # User CRUD, soft-delete, avatar upload
│   ├── roles/                 # Role CRUD, admin permission sync
│   ├── permissions/           # Permission CRUD, role-permission assignment
│   └── healths/               # Health check endpoints
│
├── infrastructure/            # Infrastructure layer
│   ├── db/                    # TypeORM setup + 5 migration files
│   ├── rabbitmq/              # AMQP producers + consumers
│   ├── realtime/              # Socket.IO gateway + SocketService
│   └── cron/                  # Scheduled jobs (@Cron decorators)
│
└── shared/                    # Global services (available everywhere without imports)
    ├── hash/                  # Password hashing (scrypt) + token generation
    ├── redis/                 # Redis typed wrapper
    ├── mail/                  # Mailgun email delivery
    ├── http-client/           # Axios wrapper with retry
    ├── response/              # SuccessResponse, ErrorResponse, ResponseStatusInterceptor
    ├── cookie/                # Secure auth cookie writer
    ├── rate-limit/            # Redis fixed-window rate limiting
    ├── google/                # Google OAuth flow
    ├── storage/               # Cloudflare R2 file upload
    └── hibp/                  # Have I Been Pwned password check
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `start:dev` | Hot-reload development server |
| `start:debug` | Development server with Node.js inspector |
| `start` | Run compiled output (production) |
| `build` | Compile TypeScript to `dist/` |
| `migration:create` | Scaffold a new empty migration file |
| `migration:generate` | Generate migration from entity changes |
| `migration:run` | Apply all pending migrations |
| `migration:revert` | Revert the last migration |
| `docker:up` | Build images and start containers |
| `docker:down` | Stop and remove containers |
| `lint` | ESLint with auto-fix |
| `format` | Prettier formatting |
| `test` | Unit tests (Jest) |
| `test:watch` | Unit tests in watch mode |
| `test:cov` | Unit tests with coverage report |
| `test:e2e` | End-to-end tests |

> Unit tests live in `src/**/*.spec.ts`. E2E tests live in `test/**/*.e2e-spec.ts`.

---

## API Documentation

Interactive Swagger UI is served at `{API_BASE_URL}/api` once the server is running.

For local development: **http://localhost:8084/api**

Set `ENABLE_SWAGGER_PROTECTION=true` with `SWAGGER_USER` + `SWAGGER_PASSWORD` to require HTTP Basic Auth on the docs page in staging/production environments.

---

## Detailed Guides

| Guide | Contents |
|-------|----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Module hierarchy, request lifecycle, base classes, patterns |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Local setup, env variables reference, database migrations |
| [AUTH.md](./docs/AUTH.md) | Authentication flows, JWT strategy, RBAC, permission system |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | How to report issues and submit pull requests |
| [CODE_OF_CONDUCT.md](./docs/CODE_OF_CONDUCT.md) | Community standards and expected behaviour |

---

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines on reporting issues and submitting pull requests.

Please also review our [Code of Conduct](./docs/CODE_OF_CONDUCT.md) before contributing.

---

## Support

**Email:** [namehiron.96@gmail.com](mailto:namehiron.96@gmail.com)

---

## License

MIT — see [LICENSE](./LICENSE) for details.
