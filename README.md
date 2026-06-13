# CV Builder

[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)]()

A microservice built with **NestJS** and **PostgreSQL** for handling delayed actions (scheduled or deferred tasks).
The service is containerized with **Docker** and connects to a cloud-hosted PostgreSQL database (Neon, Supabase, RDS, etc.) via a single `DATABASE_URL`.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Service](#running-the-service)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [Support](#support)
- [License](#license)

---

## Features

- ⚡ Built with [NestJS](https://nestjs.com/)
- 🗄️ PostgreSQL database (cloud-hosted, e.g. Neon / Supabase / RDS)
- 🐳 Ready-to-use Docker & Docker Compose setup
- 🔒 Environment-based configuration with `.env` files
- 📖 Integrated Swagger API documentation
- ✅ Supports automatic database migrations
- 🐇 RabbitMQ messaging integration for microservices
- 🌐 WebSocket support for real-time communication
- ⏱️ Task scheduling with NestJS Schedule module
- 🌍 Internationalization (i18n) support
- 🧪 Structured testing setup with Jest and Supertest
- 🖊️ Code formatting and linting with Prettier & ESLint

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (if running locally)
- [pnpm](https://pnpm.io/) (recommended)

### Clone the repository

```bash
git clone git@github.com:jahidhiron/cv-builder.git
cd cv-builder
```

## Environment Variables

Below is an example of the .env file used on the local machine for the **CV Builder Project**. You may refer to the **.env.local.example** file for guidance.

```env
# App
PORT=8080
APPLICATION_MODE=development
API_BASE_URL="http://localhost:8080"

# DB
# PostgreSQL connection string. Append ?sslmode=require for cloud providers.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cv_builder
MIGRATIONS_RUN=false

# Swagger
ENABLE_SWAGGER_PROTECTION=true
SWAGGER_USER=swagger-admin
SWAGGER_PASSWORD=Pass1234?

# RabbitMQ
ENABLE_RABBITMQ=true
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_MANAGEMENT_UI_PORT=15672
RABBITMQ_QUEUE=cv_builder_queue

# Realtime
CLIENT_SOCKET_URL="http://localhost:8080"
```

Below is an example of the .env file used on the Docker for the **CV Builder Project**. You may refer to the **.env.docker.example** file for guidance.

```env
# App
PORT=8080
APPLICATION_MODE=production
API_BASE_URL="http://localhost:8080"

# API container
API_CONTAINER_NAME=cv-builder-api

# DB
# PostgreSQL is expected to be a cloud-hosted database (Neon, Supabase, RDS).
# Set DATABASE_URL to the cloud connection string. Append ?sslmode=require for cloud providers.
DATABASE_URL=postgresql://postgres:password@localhost:5432/cv_builder
MIGRATIONS_RUN=true

# Swagger
ENABLE_SWAGGER_PROTECTION=true
SWAGGER_USER=swagger-admin
SWAGGER_PASSWORD=Pass1234?

# RabbitMQ
ENABLE_RABBITMQ=true
RABBITMQ_CONTAINER_NAME=rabbitmq
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=Pass1234!
RABBITMQ_QUEUE=cv_builder_queue
RABBITMQ_MANAGEMENT_UI_PORT=15672

# Realtime
CLIENT_SOCKET_URL="http://localhost:8080"
```

Below is an example of the .env.example file for the CV Builder Project. Please refer to the .env.example file for guidance.

```env
# App
PORT=8080
APPLICATION_MODE=production
API_BASE_URL="http://localhost:8080"

# If you are using docker
API_CONTAINER_NAME=cv-builder-api

# DB
# PostgreSQL is expected to be a cloud-hosted database (Neon, Supabase, RDS).
# Set DATABASE_URL to the cloud connection string. Append ?sslmode=require for cloud providers.
DATABASE_URL=postgresql://postgres:password@localhost:5432/cv_builder

# This setting is common for both Docker and direct database URL configurations.
# Set MIGRATIONS_RUN to true if you want to automatically run database migrations.
MIGRATIONS_RUN=true

# Swagger
ENABLE_SWAGGER_PROTECTION=true
SWAGGER_USER=swagger-admin
SWAGGER_PASSWORD=Pass1234?

# RabbitMQ
# If using a RabbitMQ as a Docker container, configure the following variables
RABBITMQ_CONTAINER_NAME=rabbitmq
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin

# If using a local RabbitMQ or a cloud-based RabbitMQ, set the RABBITMQ_URI accordingly
RABBITMQ_URI=amqp://admin:admin@localhost:5672

# These settings are common for both Docker and direct configurations.
ENABLE_RABBITMQ=true
RABBITMQ_QUEUE=cv_builder_queue
RABBITMQ_MANAGEMENT_UI_PORT=15672

# Realtime
CLIENT_SOCKET_URL="http://localhost:8080"

```

> **Important:** Ensure that you create a `.env` file in the root directory and use either the `.env.local.example` or `.env.docker.example` as a template.

## Running the Service

The CV Builder can be run locally for development or in a containerized production environment using Docker Compose.

---

### Using Docker Compose

#### Start Service

```bash
pnpm run docker:up
```

#### Stop Service

```bash
pnpm run docker:down
```

### Without Docker

#### Start Service

```bash
pnpm run start:dev
```

## API Documentation

The CV Builder uses **Swagger** to provide interactive API documentation.  
Swagger allows developers to explore and test endpoints directly from the browser.

---

### Accessing Swagger

Once the service is running (locally or in Docker), you can access Swagger UI at:

```bash
http://localhost:8080/api
```

Example for .env:

```env
PORT=8080
```

For production or staging environments, replace `localhost:8080` with the corresponding API base URL.

Example:

```bash
https://api.dev.example.com/api
```

---

## Database

The CV Builder uses **PostgreSQL** as its primary database.
Database configuration is managed via the `.env` file. The service is designed to connect to a **cloud-hosted** PostgreSQL (Neon, Supabase, RDS, etc.) using a single `DATABASE_URL` — there is no database container defined in `docker-compose.yaml`.

---

### Database Configuration

The database connection is configured using environment variables in `.env`:

| Variable         | Description                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/dbname`. Append `?sslmode=require` for cloud providers. |
| `MIGRATIONS_RUN` | Whether to run migrations automatically (`true`/`false`)                                                |

Example (cloud-hosted PostgreSQL):

```env
DATABASE_URL=postgresql://user:mysecretpassword@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
MIGRATIONS_RUN=true
```

## Project Structure

```bash
.
├── src/                                          # All application source code
│   ├── common/                                   # Cross‑cutting utilities
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dtos/
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── filters/
│   │   ├── helpers/
│   │   ├── interceptors/
│   │   ├── interfaces/
│   │   ├── middlewares/
│   │   ├── pipes/
│   │   ├── providers/
│   │   ├── repositories/
│   │   ├── swagger/
│   │   └── utils/
│   ├── config/                                   # Centralised configuration
│   │   ├── app/
│   │   ├── cors/
│   │   ├── db/
│   │   ├── i18n/
│   │   ├── logger/
│   │   ├── rabbitmq/
│   │   ├── realtime/
│   │   ├── swagger/
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── index.ts
│   ├── cron/                                     # Cron scheduler
│   │   ├── services/
│   │   └── cron.module.ts
│   ├── db/                                       # Database configuration
│   │   ├── config/
│   │   ├── interfaces/
│   │   ├── migrations/
│   │   └── database.module.ts
│   ├── modules/                                  # Feature modules (business logic)
│   │   ├── app/
│   │   └── healths/
│   ├── rabbitmq/
│   │   ├── constants/
│   │   ├── consumers/
│   │   ├── producers/
│   │   └── rabitmq.module.ts
│   ├── realtime/
│   │   ├── adapters/
│   │   ├── gateways/
│   │   ├── interfaces/
│   │   ├── services/
│   │   ├── types/
│   │   └── realtime.module.ts
│   ├── shared/
│   │   ├── hash/
│   │   ├── http-client/
│   │   ├── responses/
│   │   └── shared.module.ts
│   └── main.ts
├── test/
├── dockerfile
├── docker-compose.yaml
├── entrypoint.sh
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.build.json
├── tsconfig.json
└── .prettierrc
```

## Scripts

| Script               | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `clean`              | Remove the `dist` directory.                               |
| `build`              | Clean and build the project.                               |
| `format`             | Format source files using Prettier.                        |
| `start:dev`          | Start the application in development mode with watch mode. |
| `start:debug`        | Start the application in debug mode with watch mode.       |
| `start`              | Start the compiled application.                            |
| `docker:up`          | Build and start containers using Docker Compose.           |
| `docker:down`        | Stop and remove containers using Docker Compose.           |
| `migration:create`   | Create a new TypeORM migration.                            |
| `migration:generate` | Generate a new TypeORM migration.                          |
| `migration:run`      | Run pending migrations.                                    |
| `migration:revert`   | Revert the last executed migration.                        |
| `lint`               | Run ESLint with auto-fix.                                  |
| `test`               | Run unit tests.                                            |
| `test:watch`         | Run tests in watch mode.                                   |
| `test:cov`           | Run tests and generate coverage report.                    |
| `test:debug`         | Run tests in debug mode.                                   |
| `test:e2e`           | Run end-to-end tests.                                      |

> **Testing notes:**
>
> - The default Jest config in `package.json` uses `rootDir: "src"` and matches `*.spec.ts` files. **Unit tests must therefore live inside `src/`** — files at the repo root won't be picked up by `pnpm test`.
> - `pnpm test:e2e` uses a separate config (`test/jest-e2e.json`) with `testRegex: ".e2e-spec.ts$"`, and looks inside the `test/` folder. The two runners are intentionally isolated.

---

## Code Documentation

This documentation covers the `BaseRepository`, `AppLogger`, `Response Format`, `Swagger`, `RabbitMQ`, `Cron Job`, `Web Socket`, `i18n internationalization`, and `Application Configuration`, along with their common methods and usage examples.

It provides guidance on performing CRUD operations, handling pagination, executing raw queries, and using transactions effectively.

Each method includes a brief description and a practical example to help developers quickly understand how to use these components in real projects.

---

# Base Repository

The BaseRepository is a generic TypeORM repository that provides reusable CRUD operations, advanced query building, pagination, and raw query execution with integrated error handling and logging.

Features

⚡ Generic CRUD operations (create, createMany, findOne, update, updateMany, remove, removeMany)

🗄️ Advanced query builder with support for relations, search, sorting, pagination, and field selection

🐳 Execute raw SQL queries

🔒 Integrated error handling via ErrorResponse

📖 Logging using AppLogger

## Common Methods

The `BaseRepository` provides the following reusable methods:

| Method                                    | Description                                                 |
| ----------------------------------------- | ----------------------------------------------------------- |
| `create(data, manager?)`                  | Create a single entity                                      |
| `createMany(data[], manager?)`            | Create multiple entities                                    |
| `findOne(where, options?, manager?)`      | Find a single entity                                        |
| `update(query, data, manager?)`           | Update a single entity                                      |
| `updateMany(query, data, manager?)`       | Update multiple entities                                    |
| `remove(query, manager?)`                 | Remove a single entity                                      |
| `removeMany(query, manager?)`             | Remove multiple entities                                    |
| `list(params?)`                           | List entities without pagination                            |
| `paginatedList(params?)`                  | List entities with pagination                               |
| `rawQuery(query, parameters?, manager?)`  | Execute raw SQL queries                                     |

## How Methods Work (Short Examples)

### 1. Create a Single Entity

Creates a single entity in the database.

**Example Usage:**

```ts
const project = await projectRepository.create({ title: 'New Project' });
```

### 2. Create Multiple Entities

Creates multiple entities in a single call.

**Example Usage:**

```ts
await taskRepository.createMany([{ title: 'Task 1' }, { title: 'Task 2' }]);
```

### 3. Find One Entity

Finds a single entity matching the query.

**Example Usage:**

```ts
await taskRepository.createMany([{ title: 'Task 1' }, { title: 'Task 2' }]);
```

### 4. Update a Single Entity

Updates a single entity matching the query.

**Example Usage:**

```ts
await projectRepository.update({ id: 1 }, { title: 'Updated Title' });
```

### 5. Update Multiple Entities

Updates multiple entities matching the query.

**Example Usage:**

```ts
await taskRepository.updateMany({ projectId: 1 }, { status: 'done' });
```

### 6. Remove a Single Entity

Deletes a single entity matching the query.

**Example Usage:**

```ts
await projectRepository.remove({ id: 1 });
```

### 7. Remove Multiple Entities

Deletes multiple entities matching the query.

**Example Usage:**

```ts
await taskRepository.removeMany({ projectId: 1 });
```

### 8. List Entities With Pagination

Retrieves a paginated list of entities with optional search and sorting.

**Example Usage:**

```ts
const { q, page, limit, sortBy, projectId } = dto;

// Build the query object
const query: FindOptionsWhere<TaskEntity> = {};
if (projectId) {
  query.project = { id: projectId }; // Filter tasks by projectId
}

// Use BaseRepository's paginatedList method
const result = await this.taskRepository.paginatedList({
  q, // Optional search query string
  query, // TypeORM where condition
  searchBy: ['title'], // Fields to search in (title)
  page, // Pagination page number
  limit, // Pagination limit
  sortBy, // Sorting options [{ whom: 'createdAt', order: 'DESC' }]
  relations: { project: true }, // Include related project entity
});

// Return data with meta information
return {
  meta: result.meta, // Pagination info: total, pages, currentPage
  tasks: result.items, // List of TaskEntity objects
};
```

### 9. List Entities Without Pagination

Retrieves all entities matching the query without pagination.

**Example Usage:**

```ts
const { q, sortBy, projectId } = dto;

// Build the query object
const query: FindOptionsWhere<TaskEntity> = {};
if (projectId) {
  query.project = { id: projectId }; // Filter tasks by projectId
}

// Use BaseRepository's list method
const result = await this.taskRepository.list({
  q, // Optional search query string
  query, // TypeORM where condition
  searchBy: ['title'], // Fields to search in (title)
  sortBy, // Sorting options [{ whom: 'createdAt', order: 'DESC' }]
  relations: { project: true }, // Include related project entity
});

// Return data
return {
  tasks: result.items, // List of TaskEntity objects
};
```

### 10. Execute Raw SQL

Executes raw SQL queries directly on the database. Useful for complex queries, aggregates, or joins.

**Example Usage:**

```ts
// Example: Fetch all projects with a search term and task count
const sql = `
      SELECT p.id, p.title, COUNT(t.id) AS totalTasks
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.title LIKE ?
      GROUP BY p.id
    `;
const params = ['%My Project%'];

// Execute raw SQL via repository
const projects = await projectRepository.rawQuery(sql, params);

console.log(projects);
/*
    [
      { id: 1, title: 'My Project 1', totalTasks: 5 },
      { id: 2, title: 'My Project 2', totalTasks: 3 }
    ]
    */
```

### 11. Transaction Example

You can perform multiple repository operations in a single **transaction** using `EntityManager`.  
If any step fails, all changes are rolled back automatically.

**Example Usage:**

```ts
const result = await dataSource.transaction(async (manager: EntityManager) => {
  // Create a project
  const project = await projectRepository.create({ title: 'New Project' }, manager);

  // Create profile linked to the project
  await profileRepository.create({ bio: 'Project Bio', project }, manager);

  // Create multiple tasks linked to the project
  await taskRepository.createMany(
    [
      { title: 'Task 1', project },
      { title: 'Task 2', project },
    ],
    manager,
  );

  // Fetch and return the full project with profile and tasks
  return projectRepository.findOne(
    { id: project.id },
    { relations: { profile: true, tasks: true } },
    manager,
  );
});

console.log(result);
/*
{
  id: 1,
  title: 'New Project',
  profile: { id: 1, bio: 'Project Bio' },
  tasks: [
    { id: 1, title: 'Task 1' },
    { id: 2, title: 'Task 2' }
  ]
}
*/
```

## Benefits of Using BaseRepository

Using `BaseRepository` provides several advantages for building scalable and maintainable applications:

1. **Centralized Common Methods**  
   All CRUD operations, listing, and raw query execution are centralized. You don’t need to write repetitive repository code for each entity.

2. **Reusability Across Modules**  
   Methods like `create`, `update`, `remove`, `paginatedList`, and `list` can be used across all modules, ensuring consistency and reducing boilerplate code.

3. **Advanced Pagination & Filtering**  
   The `paginatedList` method helps easily implement pagination with search, multi-directional sorting, and filtering out-of-the-box. This saves significant development time for common list endpoints.

4. **Flexible Querying**  
   Supports advanced queries with relations, dynamic search fields, and custom TypeORM `where` conditions.

5. **Raw SQL Execution**  
   The `rawQuery` method allows executing complex queries or aggregations directly in SQL when standard ORM methods are insufficient.

6. **Transaction Support**  
   All methods support `EntityManager`, allowing multiple operations to be executed within a single transaction, ensuring data consistency.

7. **Consistency & Best Practices**  
   Using `BaseRepository` ensures that all database interactions follow the same pattern, including error handling and logging (via `ErrorResponse` and `AppLogger`).

8. **Rapid Development**  
   Developers can focus on business logic rather than implementing repetitive repository methods, speeding up development and reducing bugs.

9. **Easily Extendable**  
   You can extend `BaseRepository` for custom entity-specific methods without breaking existing functionality.

10. **Improved Maintainability**  
    Centralized repository logic makes maintenance easier, as updates or bug fixes in the base methods automatically apply across all entities using it.

---

# Supported Response Methods and Status Codes

The project uses `SuccessResponse` and `ErrorResponse` services to standardize API responses with i18n support and HTTP status codes.

| Method                  | HTTP Status               | Description                              |
| ----------------------- | ------------------------- | ---------------------------------------- |
| `ok()`                  | 200 OK                    | Generic success response                 |
| `created()`             | 201 Created               | When a new resource is created           |
| `accepted()`            | 202 Accepted              | When request is accepted for processing  |
| `noContent()`           | 204 No Content            | When action succeeds but returns no data |
| `badRequest()`          | 400 Bad Request           | Invalid input or request                 |
| `unauthorized()`        | 401 Unauthorized          | Unauthorized access                      |
| `forbidden()`           | 403 Forbidden             | Access forbidden                         |
| `notFound()`            | 404 Not Found             | Resource not found                       |
| `conflict()`            | 409 Conflict              | Conflict with existing resource          |
| `tooManyRequests()`     | 429 Too Many Requests     | Rate limit exceeded                      |
| `requestTimeout()`      | 408 Request Timeout       | Request took too long                    |
| `internalServerError()` | 500 Internal Server Error | Server-side error                        |
| `serviceUnavailable()`  | 503 Service Unavailable   | Server temporarily unavailable           |

---

## Features

- Centralized CRUD operations via BaseRepository
- Pagination, search, filtering, and multi-directional sorting support
- Raw SQL execution for complex queries
- Standardized success and error responses
- i18n support for messages based on request headers
- Automatic and consistent HTTP status codes for all responses

---

### 1. Success Response Example :

```ts
return this.successResponse.created({
  module: 'project',
  key: 'create-project', // i18n key: "project.success.create-project"
  ...project,
});
```

### Resulting Response (if language is English):

```
{
  "method": "POST",
  "success": true,
  "status": "CREATED",
  "statusCode": 201,
  "path": "/project",
  "timestamp": "2025-11-19T10:00:00.000Z",
  "message": "Project created successful",
  "data": {
    "id": 1,
    "title": "New Project"
  }
}

```

### i18n Usage:

The key (create-project) is automatically looked up in the en.json file:

```
"success": {
  "create-project": "Project created successful"
}

```

---

### 2. Error Response Example :

```ts
return this.errorResponse.badRequest({
  module: 'project',
  key: 'project-already-exist', // i18n key: "project.error.project-already-exist"
});
```

### Resulting Response (if language is English):

```
{
  "method": "POST",
  "success": false,
  "status": "BAD_REQUEST",
  "statusCode": 400,
  "path": "/project",
  "timestamp": "2025-11-19T10:05:00.000Z",
  "message": "Project title already exist"
}
```

### i18n Usage:

The key (project-already-exist) is automatically looked up in the en.json file:

```
"error": {
  "project-already-exist": "Project title already exist"
}
```

---

# Custom Logger

Custom Logger (AppLogger)

The AppLogger is a centralized logging service built on Winston and integrated into NestJS.
It provides structured, leveled logging for your application with automatic file rotation and environment-based formatting.

Key Features

- Centralized logger for the entire application
  Supports multiple log levels: log, error, warn, debug, verbose

- Automatically stores error logs in daily rotated files

- Keeps the last 14 days of error logs

- Console logs formatted for development with colorized, readable output

- Only logs debug/verbose messages in non-production environments

### Available Logger Methods:

| Method      | Log Level | Description                                          |
| ----------- | --------- | ---------------------------------------------------- |
| `log()`     | INFO      | Logs general information                             |
| `error()`   | ERROR     | Logs errors with optional stack trace                |
| `warn()`    | WARN      | Logs warnings                                        |
| `debug()`   | DEBUG     | Logs debug messages in non-production environments   |
| `verbose()` | VERBOSE   | Logs verbose messages in non-production environments |

### Example: Logging an Error

```
try {
  await this.dataSource.query('SELECT 1');
} catch (err: unknown) {
  this.logger.error(
    'Database query failed',
    err instanceof Error ? err.stack : String(err),
    'DbHealthProvider'
  );
}

```

### What happens:

- The error is logged to console (if not in production)
- A structured JSON error log is stored in the daily rotated file:

```
/logs/error-2025-11-19.log
```

### Log format includes:

```
{
  "level": "error",
  "message": "Database query failed",
  "stack": "Error: ...",
  "context": "DbHealthProvider",
  "timestamp": "2025-11-19 10:15:00"
}

```

### Build and Start Containers

---

# Swagger

This project uses NestJS Swagger to generate API documentation automatically. It provides descriptions, request/response schemas, and example responses for each endpoint, including error and success cases.

## How Swagger Works

### 1. Swagger Decorators

Each endpoint in the controller is decorated with **custom Swagger decorators** to automatically generate API documentation.

**Example:**

```ts
@Post()
@CreateProjectSwaggerDocs()
async create(@Body() dto: CreateProjectDto) {
  // controller logic
}
```

### 2. Example: Create Project Endpoint

This example demonstrates how to use the custom Swagger helper `CreateProjectSwaggerDocs` to document the **Create Project** API endpoint.  
It shows how to define the operation summary, request body, success response, and standard error responses with optional examples.

```
export function CreateProjectSwaggerDocs() {
  return applyDecorators(
    // Adds the operation summary and description in Swagger UI
    ApiOperation({
      summary: 'Create a new project', // Short description for Swagger endpoint
      description: 'This endpoint allows creating a new project.' // Detailed explanation
    }),

    // Defines the request body schema for Swagger UI
    ApiBody({
      type: CreateProjectDto // The DTO that represents the structure of the request body
    }),

    // Defines the success response for the endpoint
    SwaggerApiSuccessResponse(ProjectResponseDto, {
      method: HttpMethod.POST,               // HTTP method
      status: HTTP_STATUS.CREATED.context,   // Status text for Swagger UI
      statusCode: HTTP_STATUS.CREATED.status,// HTTP status code (201)
      path: ModuleName.Project,              // Path/module for this endpoint
      message: 'Project created successful', // Success message
    }),

    // Defines a Bad Request (400) response with examples
    BadRequestResponse({
      path: ModuleName.Project,              // Path/module
      method: HttpMethod.POST,               // HTTP method
      examples: {
        // Example for validation error
        validationError: {
          summary: 'Validation Error',      // Short description for Swagger UI
          message: 'Validation Error',      // Error message returned
          errors: [{ field: 'title', message: 'Title should not be empty' }] // Field-level errors
        },
        // Example for duplicate project title
        duplicateTitle: {
          summary: 'Duplicate Project Title',
          message: 'Project title already exist'
        },
      },
    }),

    // Defines Internal Server Error (500) response
    InternalServerErrorResponse({
      path: ModuleName.Project,              // Path/module
      method: HttpMethod.POST                // HTTP method
    })
  );
}
```

## Available Swagger Helpers

This table lists the custom Swagger helpers used throughout the Project module.  
These helpers standardize the API documentation by defining consistent success and error responses, including optional example payloads for better clarity in Swagger UI.

| Swagger Helper                | HTTP Status / Type        | Description                                                                                        |
| ----------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `SwaggerApiSuccessResponse`   | 200 / 201 / custom        | Defines successful response structure with optional examples.                                      |
| `BadRequestResponse`          | 400 Bad Request           | Standard response for validation errors or bad requests, supports examples.                        |
| `UnauthorizedResponse`        | 401 Unauthorized          | Standard response for unauthorized access.                                                         |
| `ForbiddenResponse`           | 403 Forbidden             | Standard response for forbidden access.                                                            |
| `NotFoundResponse`            | 404 Not Found             | Standard response for resource not found.                                                          |
| `ConflictResponse`            | 409 Conflict              | Standard response for conflicts, e.g., duplicate entries.                                          |
| `UnprocessableEntityResponse` | 422 Unprocessable Entity  | Response for invalid business logic or unprocessable data.                                         |
| `TooManyRequestsResponse`     | 429 Too Many Requests     | Rate-limit exceeded response.                                                                      |
| `InternalServerErrorResponse` | 500 Internal Server Error | Response for unexpected server errors.                                                             |
| `ServiceUnavailableResponse`  | 503 Service Unavailable   | Response when the service is temporarily unavailable.                                              |
| `buildSchema`                 | N/A                       | Internal helper that generates full Swagger schema for a specific HTTP status, including examples. |

---

# Others

## Config Module

The `ConfigModule` centralizes all application configuration, including environment variables, database settings, Swagger, logging, RabbitMQ, WebSocket, Cron Jobs, and internationalization.  
It ensures every part of the system can easily access configuration through dependency injection.

### How It Works

1. **Global Configuration Loading**

   The module loads multiple configuration files globally via `@nestjs/config`:

```ts
NestConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, swaggerConfig, dbConfig, rabbitmqConfig, realtimeConfig],
});
```

## Realtime Module

The `RealtimeModule` enables WebSocket-based real-time communication across the application.  
It uses `socket.io` and NestJS gateways to allow broadcasting and targeted communication between the server and connected clients.

### How It Works

- The module provides a `SocketService` that abstracts:
  - Emitting events to all clients
  - Emitting events to a specific client
  - Storing and sharing the active Socket.io namespace

- Two WebSocket gateways are included:
  - **MainGateway** – Handles global connection initialization and connection logs.
  - **ProfileGateway** – Handles profile-related WebSocket events (e.g., `get_profile`).

### Features

- Real-time communication using WebSockets
- Broadcast events to all connected clients
- Send updates to a specific user
- Extendable for new event channels
- Optionally integrates JWT authentication middleware
- Can be triggered by internal events (e.g., RabbitMQ consumers)

### Example

Sending an event to all connected clients:

```ts
this.socketService.emitToAll('profile_update', payload);
```

## Cron Module

The `CronModule` is responsible for running scheduled background tasks in the application.  
These tasks run automatically at fixed intervals using NestJS `@nestjs/schedule` cron decorators.

### Responsibilities

- Periodically pick pending work items (e.g., profiles that need updates)
- Dispatch jobs into RabbitMQ for asynchronous processing
- Log status and failures
- Auto-handle queue failures by reverting profile states

### How It Works

The module includes a main service:

#### `UpdateProfileService`

This is a scheduled background worker that:

1. Runs every **30 seconds** using:

```ts
@Cron(CronExpression.EVERY_30_SECONDS)
```

## RabbitMQ Module

The `RabbitMqModule` handles all asynchronous message-based communication in the application.  
It is responsible for publishing jobs, consuming jobs, and managing retry logic using RabbitMQ.

This module enables high-performance background processing and decoupled service interactions.

---

## Responsibilities

- Configure and initialize the RabbitMQ microservice client
- Publish messages (producers)
- Consume messages (consumers)
- Handle failures using DLX (Dead Letter Exchange)
- Support real-time updates with WebSocket broadcasting
- Ensure reliable job delivery with retries and backoff

---

## How It Works

The module contains:

### **1. A Producer**

`UpdateProfileProducerService`

This service publishes messages into RabbitMQ.  
It uses lazy connection handling to ensure the RMQ client connects **once** and safely retries on failure.

**Key features:**

- Ensures RMQ connection (`ensureConnected()`)
- Emits events with a **2-second timeout**
- Logs failures without throwing exceptions
- Returns `true/false` depending on queue success

**Publish Flow:**

```
validate payload → ensure connection → emit event → handle timeout → log → return status
```

---

### **2. A Consumer**

`UpdateProfileConsumerController`

This controller listens for events and processes profile update jobs.

**Processing Logic:**

1. Validate and lock the profile (`Queued → Processing`)
2. Apply update (increment version, set timestamps, mark completed)
3. Broadcast updates via WebSocket
4. Acknowledge on success (`ack`)
5. On failure:
   - Mark for retry with `nextRunAt +5 minutes`
   - Push message to DLX using `nack`

**Failure Flow:**

```
processing fail → update profile with retry time → nack (DLX) → auto retry by cron
```

---

## RabbitMQ Client Configuration

The client is registered dynamically using application configuration (`ConfigService`):

```ts
ClientsModule.registerAsync([
  {
    name: ServiceNames.CV_BUILDER_SYNC,
    useFactory: (configService: ConfigService) => ({
      transport: Transport.RMQ,
      options: {
        urls: [configService.rabbitmq.rabbitmqUri],
        queue: configService.rabbitmq.rabbitmqQueue,
        queueOptions: { durable: true },
      },
    }),
  },
]);
```

### High-Level Flow

```
Cron → Pick Profiles → Producer Publishes Jobs → RabbitMQ → Consumer Processes → Real-time Emit
```

### Key Features

- Fully decoupled async processing
- Lazy + safe RMQ connection handling
- Timeout-protected message publishing
- Dead-letter exchange retry logic
- Real-time WebSocket broadcasting
- Robust error recovery
- Clean separation between Producer and Consumer

### Testing Real-Time Socket

If you want to test the real-time WebSocket functionality, you can use the provided `test-socket.html` file located in the root directory of the project.

- Open the file in your browser: [`test-socket.html`](./test-socket.html)
- It allows you to connect to the `/realtime` namespace and test emitting/listening to events.

> **Note:** Make sure your server is running and the WebSocket endpoint is accessible.

# Contributing to CV Builder

We welcome contributions to this project! To get started, fork the repository and clone it to your local machine. Here are some guidelines to follow:

## Reporting Issues

Please create a new issue for any bugs or suggestions you have. Be sure to provide clear details about the problem, including steps to reproduce.

## Submitting Pull Requests

- Fork the repository and clone it locally.
- Create a new branch (`git checkout -b feature-name`).
- Write your code and tests.
- Commit your changes (`git commit -am 'Add new feature'`).
- Push your branch to your fork (`git push origin feature-name`).
- Submit a pull request.

## Contributing

We welcome contributions to improve the CV Builder! Please follow the guidelines in the [CONTRIBUTING.md](./CONTRIBUTING.md) file for details on how to contribute.

### How to Contribute

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone git@github.com:jahidhiron/cv-builder.git
   cd cv-builder
   ```

## Code of Conduct

We are committed to maintaining a positive and inclusive environment for all contributors. Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) to understand the expectations for participation in this project.

By participating, you agree to uphold these standards and contribute positively to the community.

## Support

If you need help or have questions, feel free to reach out:

📧 **Email:** **[namehiron.96@gmail.com](mailto:namehiron.96@gmail.com)**

## License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for details.
