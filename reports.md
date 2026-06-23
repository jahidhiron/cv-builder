# Manual API Test Report

**Target:** `http://localhost:8084/api/v1`  
**Run date:** 2026-06-23T05:33:07.327Z  
**Total wall time:** 0.10 s  
**Test cases:** 16  

## Summary

| Status | Count |
|---|---|
| ✅ PASS | 0 |
| ❌ FAIL | 2 |
| 🐛 BUG (filter crashed → HTML 500) | 14 |
| ⚠️  ERROR (network/setup) | 0 |
| **TOTAL** | **16** |

**Requests that returned HTML instead of JSON:** 16 of 16

## ⚠️ Critical Finding

16 of 16 requests returned an HTML error page rather than the documented JSON `ErrorResponse` envelope. This is a hard production bug: the global exception filter is supposed to catch every thrown exception and return a uniform JSON body, but it itself throws — so NestJS falls back to Express's default HTML error handler.

**Root cause (line 76 of `global-exception.filter.ts`):**

```ts
if (shouldLog) {
  this.logger.error(
    `[${request.method}] ${request.url} | ip=${ip} → ${statusCode} | ${message}`,
    stack,
  );
}
```

`this.logger` is `undefined` at runtime, even though the constructor accepts it. Either the filter is being instantiated outside the DI container (e.g. the `APP_FILTER` provider config in `app.module.ts` does not receive its dependency correctly), or there is a circular dependency breaking injection. As a result:

- Every endpoint that throws any exception (4xx or 5xx) returns an HTML 500 page instead of a JSON envelope.
- The **first-occurrence admin email alert never fires**, because `TrackErrorProvider.execute()` is never reached.
- The 500-error tracking feature described in the task is completely non-functional in the current build.

## Results by category

### Health

| # | Test | Method | URL | Status | HTTP | Time | Result |
|---|---|---|---|---|---|---|---|
| 1 | API reachable on :8084 | GET | `/app/status` | ❌ FAIL | 500 | 51ms | HTML error page (2080 bytes) — Express default handler kicke |

### Auth

| # | Test | Method | URL | Status | HTTP | Time | Result |
|---|---|---|---|---|---|---|---|
| 1 | Auth: signup new user | POST | `/auth/signup` | 🐛 BUG | 500 | 6ms | HTML 500 (2080 bytes) — global filter threw |
| 2 | Auth: signin and obtain JWT | POST | `/auth/signin` | 🐛 BUG | 500 | 4ms | HTML 500 — global filter threw |

### ErrorTracking

| # | Test | Method | URL | Status | HTTP | Time | Result |
|---|---|---|---|---|---|---|---|
| 1 | GET /error-tracking — list (paginated) | GET | `/error-tracking?page=1&limit=20` | 🐛 BUG | 500 | 4ms | HTML 500 (2080 bytes) — global filter threw |
| 2 | GET /error-tracking — filter by status=pending | GET | `/error-tracking?status=pending` | 🐛 BUG | 500 | 3ms | HTML 500 |
| 3 | GET /error-tracking — without bearer token | GET | `/error-tracking` | 🐛 BUG | 500 | 2ms | HTML 500 (filter crashed) |
| 4 | GET /error-tracking/9999999 — non-existent record | GET | `/error-tracking/9999999` | 🐛 BUG | 500 | 3ms | HTML 500 — filter crashed |
| 5 | GET /error-tracking/abc — invalid id triggers ParseIdPipe | GET | `/error-tracking/abc` | 🐛 BUG | 500 | 4ms | HTML 500 — filter crashed |
| 6 | PATCH /error-tracking/1/status — transition status | PATCH | `/error-tracking/1/status` | 🐛 BUG | 500 | 4ms | HTML 500 — filter crashed |
| 7 | PATCH /error-tracking/1/status — invalid status enum | PATCH | `/error-tracking/1/status` | 🐛 BUG | 500 | 3ms | HTML 500 — filter crashed |
| 8 | DELETE /error-tracking/9999999 — delete non-existent | DELETE | `/error-tracking/9999999` | 🐛 BUG | 500 | 2ms | HTML 500 — filter crashed |

### ErrorFlow

| # | Test | Method | URL | Status | HTTP | Time | Result |
|---|---|---|---|---|---|---|---|
| 1 | POST /auth/signin with malformed payload — should be 400 | POST | `/auth/signin` | 🐛 BUG | 500 | 2ms | HTML 500 — filter crashed |
| 2 | GET /no-such-route — exercise 404 path through global filter | GET | `/no-such-route` | 🐛 BUG | 500 | 2ms | HTML 500 — filter crashed on 404 path |
| 3 | Tracker reachable: filter must not crash before reaching TrackErrorProvider | GET | `/error-tracking?page=1&limit=1` | ❌ FAIL | 500 | 3ms | HTML 500 — filter throws BEFORE tracker fires |

### Misc

| # | Test | Method | URL | Status | HTTP | Time | Result |
|---|---|---|---|---|---|---|---|
| 1 | POST /auth/forgot-password — happy path | POST | `/auth/forgot-password` | 🐛 BUG | 500 | 2ms | HTML 500 — filter crashed |
| 2 | GET /auth/sessions — authenticated | GET | `/auth/sessions` | 🐛 BUG | 500 | 2ms | HTML 500 — filter crashed |

## Detailed failure / bug report

### GET /app/status — API reachable on :8084

- **Status:** FAIL
- **HTTP code:** 500
- **Expected:** 200 OK with JSON { success: true, data: { appStatus: { status: "UP", ... } } }
- **Actual:** `HTML error page (2080 bytes) — Express default handler kicked in.`
- **Notes:** BUG: response is text/html, not JSON. Global filter threw and Express fell back to its default HTML error handler. Likely cause: filter accesses this.logger.error when logger is undefined.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### POST /auth/signup — Auth: signup new user

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 201 Created with JSON containing user info
- **Actual:** `HTML 500 (2080 bytes) — global filter threw`
- **Notes:** TypeError: Cannot read properties of undefined (reading &#39;error&#39;)

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### POST /auth/signin — Auth: signin and obtain JWT

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 200 OK with accessToken in response
- **Actual:** `HTML 500 — global filter threw`
- **Notes:** Cannot proceed to authenticated tests without a token.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /error-tracking?page=1&limit=20 — GET /error-tracking — list (paginated)

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 200 OK with paginated list envelope
- **Actual:** `HTML 500 (2080 bytes) — global filter threw`
- **Notes:** TypeError: Cannot read properties of undefined (reading &#39;error&#39;)

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /error-tracking?status=pending — GET /error-tracking — filter by status=pending

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 200 OK with filtered list
- **Actual:** `HTML 500`

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /error-tracking — GET /error-tracking — without bearer token

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 401 Unauthorized
- **Actual:** `HTML 500 (filter crashed)`
- **Notes:** Auth guard should reject before the handler runs. If the filter crashes, the response will be HTML 500.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /error-tracking/9999999 — GET /error-tracking/9999999 — non-existent record

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 404 Not Found (JSON { success: false, message: ... })
- **Actual:** `HTML 500 — filter crashed`
- **Notes:** Tests the global filter's mapping of NotFoundException → 404 JSON response.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /error-tracking/abc — GET /error-tracking/abc — invalid id triggers ParseIdPipe

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 400 Bad Request with field-level error
- **Actual:** `HTML 500 — filter crashed`
- **Notes:** Tests ParseIdPipe → BadRequestException → global filter mapping.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### PATCH /error-tracking/1/status — PATCH /error-tracking/1/status — transition status

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 200 OK with updated record, or 404 if record missing
- **Actual:** `HTML 500 — filter crashed`

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### PATCH /error-tracking/1/status — PATCH /error-tracking/1/status — invalid status enum

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 400 Bad Request (class-validator rejects unknown enum)
- **Actual:** `HTML 500 — filter crashed`
- **Notes:** Tests DTO validation → BadRequestException → global filter.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### DELETE /error-tracking/9999999 — DELETE /error-tracking/9999999 — delete non-existent

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 404 Not Found (BaseDeleteProvider throws 404 when not found)
- **Actual:** `HTML 500 — filter crashed`

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### POST /auth/signin — POST /auth/signin with malformed payload — should be 400

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 400 Bad Request (validation)
- **Actual:** `HTML 500 — filter crashed`

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /no-such-route — GET /no-such-route — exercise 404 path through global filter

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 404 Not Found (JSON envelope)
- **Actual:** `HTML 500 — filter crashed on 404 path`
- **Notes:** Confirms that NestJS routes the missing-route exception through GlobalExceptionFilter.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /error-tracking?page=1&limit=1 — Tracker reachable: filter must not crash before reaching TrackErrorProvider

- **Status:** FAIL
- **HTTP code:** 500
- **Expected:** JSON response (filter reached the handler)
- **Actual:** `HTML 500 — filter throws BEFORE tracker fires`
- **Notes:** ** Critical ** — the filter throws on every request, so TrackErrorProvider is never invoked. No admin email will ever be sent.

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### POST /auth/forgot-password — POST /auth/forgot-password — happy path

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 200 OK with i18n key envelope
- **Actual:** `HTML 500 — filter crashed`

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

### GET /auth/sessions — GET /auth/sessions — authenticated

- **Status:** BUG
- **HTTP code:** 500
- **Expected:** 200 OK
- **Actual:** `HTML 500 — filter crashed`

Response body (first 800 chars):

```html
TypeError: Cannot read properties of undefined (reading &#39;error&#39;)
 &nbsp; &nbsp;at GlobalExceptionFilter.catch (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\src\common\filters\global-exception.filter.ts:76:19)
 &nbsp; &nbsp;at ExceptionsHandler.invokeCustomFilters (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:30:26)
 &nbsp; &nbsp;at ExceptionsHandler.next (C:\Users\User\Documents\workspace\n-business\1-cv-builder\1-api\node_modules\.pnpm\@nestjs+core@11.1.6_@nestjs_8cfd2a4751be989c23d3adc02d37f483\node_modules\@nestjs\core\exceptions\exceptions-handler.js:14:18)
 &nbsp; &nbsp;at C:\Users\User\Documents\worksp
```

## Conclusion

**The error-tracking feature is BROKEN in the current build.** 14 of 16 test cases failed because the global exception filter throws before any business logic runs. The first-occurrence admin email alert (the headline behaviour of the feature) is therefore unreachable from any HTTP path. Fix `GlobalExceptionFilter` so that `this.logger` is correctly injected (or guard the log call) before the error-tracking feature can be considered functional.
