# Authentication & Authorization Guide

How the CV Builder API handles identity, sessions, and access control.

---

## Table of Contents

- [Overview](#overview)
- [Authentication Flows](#authentication-flows)
  - [Email / Password Signup](#email--password-signup)
  - [Email / Password Signin](#email--password-signin)
  - [Google OAuth Signin](#google-oauth-signin)
  - [Token Refresh](#token-refresh)
  - [Logout](#logout)
  - [Email Verification](#email-verification)
  - [Password Reset](#password-reset)
  - [Change Password](#change-password)
- [JWT Strategy](#jwt-strategy)
- [Sessions](#sessions)
- [Route Access Control](#route-access-control)
  - [Public Routes (@Auth(AuthType.None))](#public-routes-authauthtypenone)
  - [Protected Routes (default)](#protected-routes-default)
  - [Explicit Permissions (@RequirePermissions)](#explicit-permissions-requirepermissions)
  - [Skip Permission Check (@SkipPermissions)](#skip-permission-check-skippermissions)
- [RBAC System](#rbac-system)
  - [Roles](#roles)
  - [Permissions](#permissions)
  - [Auto Permission Discovery](#auto-permission-discovery)
- [Security Features](#security-features)

---

## Overview

The API uses a two-token scheme:

- **Access token** — Short-lived JWT (default 15 min). Sent as `Authorization: Bearer <token>` header or `accessToken` cookie. Used to authenticate every API call.
- **Refresh token** — Long-lived (default 7 days). Sent as `refreshToken` cookie or in the request body. Used only at `POST /v1/auth/refresh-token` to obtain a new access token.

Authorization is handled separately via **RBAC** (Role-Based Access Control): every user is assigned a role, and that role carries a set of named permissions.

---

## Authentication Flows

### Email / Password Signup

```
POST /v1/auth/signup
Body: { firstName, lastName, email, password }

1. Validate DTO (password strength, email format)
2. Check HIBP if HIBP_CHECK_ENABLED=true
3. Hash password (scrypt)
4. Save user (role = User, isEmailVerified = false)
5. Generate and save email verification token
6. Send verification email via Mailgun
7. Return 201 with user payload
```

### Email / Password Signin

```
POST /v1/auth/signin
Body: { email, password }

1. Find user by email (must not be soft-deleted)
2. Verify password hash
3. Check user is active (isActive = true)
4. Create access token (JWT, sub = userId)
5. Create refresh token (stored in DB, hashed)
6. Record login history
7. Write tokens to HttpOnly cookies
8. Return 200 with { accessToken, user }
```

### Google OAuth Signin

```
POST /v1/auth/google-signin
Body: { idToken }

1. Verify Google ID token via google-auth-library
2. Extract email + profile from payload
3. Find or create user (isEmailVerified = true for OAuth users)
4. Issue access + refresh tokens (same as normal signin from step 4)
```

### Token Refresh

```
POST /v1/auth/refresh-token
Body / Cookie: { refreshToken }

1. Find refresh token record in DB (by hash)
2. Verify token is not expired or revoked
3. Verify owning user is still active
4. Rotate: revoke old refresh token, issue new access + refresh tokens
5. Return 200 with new { accessToken }
```

The old refresh token is invalidated on every use (rotation). Storing a stolen refresh token and replaying it after the legitimate user has already refreshed will fail.

### Logout

```
DELETE /v1/auth/logout    (or POST in some versions)
Cookie / Body: { refreshToken }

1. Find and revoke the refresh token record
2. Clear auth cookies
3. Return 200
```

### Email Verification

```
POST /v1/auth/verify-email
Body: { token }

1. Find token record (must not be expired or already used)
2. Mark user isEmailVerified = true
3. Invalidate the token
4. Return 200
```

Resend the verification email:
```
POST /v1/auth/resend-verification
Body: { email }
```

### Password Reset

```
# Step 1 — Request reset link
POST /v1/auth/forgot-password
Body: { email }

1. Find user by email
2. Generate a short-lived reset token
3. Send reset-password email with link: {CLIENT_BASE_URL}/reset-password?token=xxx
4. Return 200 (same response whether email exists or not — no enumeration)

# Step 2 — Apply new password
POST /v1/auth/reset-password
Body: { token, newPassword }

1. Validate token (not expired, not used)
2. Check password history (reject if same as last N passwords)
3. Hash new password
4. Update user.password
5. Invalidate all existing refresh tokens for this user
6. Invalidate the reset token
7. Return 200
```

### Change Password

```
PATCH /v1/auth/change-password    (authenticated)
Body: { currentPassword, newPassword }

1. Verify currentPassword against stored hash
2. Check HIBP (if enabled)
3. Check password history (reject reuse)
4. Hash and save new password
5. Save old password to history
6. Revoke all other sessions (optional — configurable)
7. Return 200
```

---

## JWT Strategy

Access tokens are signed with `JWT_ACCESS_SECRET` using the HS256 algorithm.

**Payload shape:**

```ts
interface JwtPayload {
  sub: number;           // User ID
  email: string;
  role: string;          // Role name (e.g. "Admin", "User")
  permissions: string[]; // Permission keys (e.g. ["users:read", "users:update"])
  iat: number;
  exp: number;
}
```

`permissions` is embedded in the token to avoid a DB query on every request. When a user's permissions change, they need to re-authenticate (or wait for their current token to expire) to get the updated list.

**Token delivery:**

Tokens are sent in two ways simultaneously:
1. **Response body** — `{ accessToken: "eyJ…" }` for SPA clients that store tokens in memory.
2. **HttpOnly cookies** — `accessToken` and `refreshToken` cookies for browser clients that rely on automatic cookie sending.

The `AuthGuard` checks both — whichever is present first is used.

---

## Sessions

Each refresh token stored in the `refresh_tokens` table represents one active session. Fields:

| Column | Description |
|--------|-------------|
| `userId` | Owning user |
| `tokenHash` | Hashed token value (bcrypt) |
| `expiresAt` | Expiry timestamp |
| `isRevoked` | Soft-revoke flag |
| `deviceInfo` | User-agent string |
| `ipAddress` | Client IP at signin |
| `lastUsedAt` | Updated on every refresh |

**Session endpoints:**

```
GET    /v1/auth/sessions        # List all active sessions for current user
DELETE /v1/auth/sessions/:id    # Revoke a specific session
```

`JWT_MAX_SESSION_DAYS` controls how old a session can be before it is automatically cleaned up by the cron job.

---

## Route Access Control

### Public Routes (@Auth(AuthType.None))

No token required. Both `AuthGuard` and `PermissionsGuard` skip these routes entirely.

```ts
@Auth(AuthType.None)      // applied at class level
@Controller('app')
export class AppController {
  @Get('status')
  appStatus() { … }       // GET /v1/app/status — no token required
}
```

### Protected Routes (default)

Every route is protected by default. The guard automatically derives the required permission from the HTTP method and controller path:

| HTTP Method | Derived action |
|-------------|---------------|
| GET | `read` |
| POST | `create` |
| PATCH / PUT | `update` |
| DELETE | `delete` |

Example: `PATCH /v1/users/:id` → requires `users:update` permission.

### Explicit Permissions (@RequirePermissions)

Override the auto-derived permission with an explicit list:

```ts
@Post('sync-admin-permissions')
@RequirePermissions('roles:manage-permissions')
async syncAdminPermissions() { … }
```

Multiple permissions = all must be present (AND logic):

```ts
@RequirePermissions('users:read', 'users:update')
```

### Skip Permission Check (@SkipPermissions)

Allow authenticated users to access a route regardless of their permissions:

```ts
@SkipPermissions()
@Get('profile')
getOwnProfile() { … }
```

Use sparingly — typically for "own resource" operations where a separate guard or service-level check confirms ownership.

---

## RBAC System

### Roles

Defined in the `roles` table. Two seeded roles:

| Role | Description |
|------|-------------|
| `User` | Default role for registered users |
| `Admin` | Full access to all permissions |

Roles are managed via `POST/PATCH/DELETE /v1/roles`.

### Permissions

Defined in the `permissions` table. Each permission has a `key` (e.g. `users:read`) and a human-readable `name`.

Permissions are assigned to roles via `POST /v1/roles/:roleId/permissions` with a list of permission IDs.

Seeded admin permissions (from migration 001):
```
roles:create    roles:read    roles:update    roles:delete    roles:restore    roles:manage-permissions
users:create    users:read    users:update    users:delete    users:restore
```

### Auto Permission Discovery

`SyncAdminPermissionsProvider` (`POST /v1/roles/sync-admin-permissions`) scans all registered controllers at runtime using NestJS's `DiscoveryService` and `Reflector`. For each route handler it finds:

1. If `@RequirePermissions('key')` is present → use those keys.
2. Otherwise derive `{controllerPath}:{httpMethodAction}`.

All discovered keys are upserted into the `permissions` table and assigned to the Admin role. This means:

- After adding a new controller/endpoint, call `POST /v1/roles/sync-admin-permissions` once to register the new permission and grant it to Admin automatically.
- This endpoint is idempotent — calling it multiple times is safe.

---

## Security Features

| Feature | Description |
|---------|-------------|
| **Password hashing** | scrypt via `HashService` (memory-hard, replay-resistant) |
| **Password history** | Prevents reusing the last N passwords on reset/change |
| **HIBP check** | Optional `HIBP_CHECK_ENABLED=true` — rejects passwords found in data breaches |
| **Token rotation** | Refresh tokens are single-use; each refresh issues a new one and revokes the old |
| **Session limit** | `JWT_MAX_SESSION_DAYS` caps session age; cron job prunes expired tokens |
| **Rate limiting** | Redis fixed-window rate limiting via `RateLimitGuard` |
| **CORS allowlist** | Only known origins receive CORS headers (returns 200 with no CORS headers for unknown origins — not 403) |
| **Helmet** | Strict HTTP security headers (HSTS in production, X-Frame-Options, etc.) |
| **Audit log** | All auth events recorded in `security_audit_logs` with IP, device, action, and timestamp |
| **HttpOnly cookies** | Auth tokens stored in HttpOnly cookies to prevent XSS token theft |
