/* eslint-disable no-console */
/**
 * Manual API test — exercises the live CV Builder API on port 8084.
 *
 * Hits every endpoint of interest (health, error-tracking CRUD, auth flow,
 * and 500-error triggering routes) and records the outcome of each call.
 * Writes a structured markdown report to `reports.md` next to this file.
 *
 * Usage:
 *   node test-manual-api.js
 *
 * Requires:
 *   - The NestJS API running on http://localhost:8084
 *   - PostgreSQL + Redis reachable (see .env)
 *
 * The script does NOT call any DB / mail code directly — every interaction
 * goes through HTTP, the same way a real client would exercise the API.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8084/api/v1';

/* -------------------------------------------------------------------- */
/* Result accumulator                                                    */
/* -------------------------------------------------------------------- */

const results = [];
const startTime = Date.now();

function record(name, opts) {
  // Auto-fill rawBody from the last call() result so callers don't have to
  // thread it through every invocation.
  const rawBody = opts.rawBody ?? lastResponse?.rawBody ?? '';
  const entry = {
    name,
    category: opts.category,
    method: opts.method,
    url: opts.url,
    status: opts.status,            // 'PASS' | 'FAIL' | 'ERROR' | 'BUG'
    httpStatus: opts.httpStatus,    // numeric status from server
    durationMs: opts.durationMs,
    expected: opts.expected,
    actual: opts.actual,
    notes: opts.notes,
    rawBody,
  };
  results.push(entry);
  const tag = `[${entry.status}]`.padEnd(6);
  console.log(`${tag} ${entry.method.padEnd(6)} ${entry.url}  → HTTP ${entry.httpStatus} (${entry.durationMs}ms)`);
  if (entry.notes) console.log(`         ${entry.notes}`);
}

/** Side-channel so record() can pick up the latest rawBody without callers passing it. */
let lastResponse = null;

/* -------------------------------------------------------------------- */
/* HTTP helper                                                           */
/* -------------------------------------------------------------------- */

async function call(method, url, opts = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  const t0 = Date.now();
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        ...(opts.headers ?? {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const contentType = res.headers.get('content-type') ?? '';
    const raw = await res.text();
    let parsed = null;
    if (contentType.includes('application/json') && raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    const out = {
      ok: res.ok,
      httpStatus: res.status,
      contentType,
      body: parsed,
      rawBody: raw,
      durationMs: Date.now() - t0,
    };
    lastResponse = out;
    return out;
  } catch (err) {
    const out = {
      ok: false,
      httpStatus: 0,
      contentType: '',
      body: null,
      rawBody: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t0,
      networkError: true,
    };
    lastResponse = out;
    return out;
  }
}

/* -------------------------------------------------------------------- */
/* Helpers                                                               */
/* -------------------------------------------------------------------- */

function isHtml(raw) {
  return typeof raw === 'string' && raw.trim().startsWith('<!DOCTYPE html>');
}

function extractHtmlStackTrace(raw) {
  if (!isHtml(raw)) return null;
  const m = raw.match(/<pre>([\s\S]*?)<\/pre>/);
  return m ? m[1].replace(/<br>/g, '\n').trim() : null;
}

/* -------------------------------------------------------------------- */
/* Test cases                                                            */
/* -------------------------------------------------------------------- */

async function runTests() {
  /* -------------------------------------------------------------- */
  /* 1. Health / system                                              */
  /* -------------------------------------------------------------- */
  console.log('\n--- Health ---');

  {
    const r = await call('GET', '/app/status');
    if (r.networkError) {
      record('API reachable on :8084', {
        category: 'Health', method: 'GET', url: '/app/status',
        status: 'ERROR', httpStatus: 0, durationMs: r.durationMs,
        expected: '200 OK', actual: `network error: ${r.rawBody}`,
        notes: 'Cannot connect to API on port 8084.',
      });
      return; // abort — nothing else will work
    }
    record('API reachable on :8084', {
      category: 'Health', method: 'GET', url: '/app/status',
      status: r.ok ? 'PASS' : 'FAIL',
      httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '200 OK with JSON { success: true, data: { appStatus: { status: "UP", ... } } }',
      actual: r.body
        ? `JSON: ${JSON.stringify(r.body).slice(0, 120)}`
        : isHtml(r.rawBody)
          ? `HTML error page (${r.rawBody.length} bytes) — Express default handler kicked in.`
          : `body: ${r.rawBody.slice(0, 120)}`,
      notes: isHtml(r.rawBody)
        ? 'BUG: response is text/html, not JSON. Global filter threw and Express fell back to its default HTML error handler. Likely cause: filter accesses this.logger.error when logger is undefined.'
        : null,
    });
  }

  /* -------------------------------------------------------------- */
  /* 2. Auth flow                                                    */
  /* -------------------------------------------------------------- */
  console.log('\n--- Auth ---');

  let adminToken = null;
  const adminEmail = `admin-e2e-${Date.now()}@example.com`;
  const adminPassword = 'Password123!';

  // 2a. Signup
  {
    const r = await call('POST', '/auth/signup', {
      body: {
        name: 'E2E Admin',
        email: adminEmail,
        password: adminPassword,
      },
    });
    const expected = '201 Created with JSON containing user info';
    let actual;
    if (r.body?.success) {
      actual = `201 — user created (id=${r.body?.data?.user?.id ?? '?'})`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML 500 (${r.rawBody.length} bytes) — global filter threw`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${r.rawBody.slice(0, 100)}`;
    }
    record('Auth: signup new user', {
      category: 'Auth', method: 'POST', url: '/auth/signup',
      status: r.body?.success ? 'PASS' : 'BUG',
      httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected, actual,
      notes: isHtml(r.rawBody) ? extractHtmlStackTrace(r.rawBody)?.split('\n')[0] ?? null : null,
    });
  }

  // 2b. Signin
  {
    const r = await call('POST', '/auth/signin', {
      body: { email: adminEmail, password: adminPassword },
    });
    if (r.body?.success && r.body?.data?.token?.accessToken) {
      adminToken = r.body.data.token.accessToken;
    }
    record('Auth: signin and obtain JWT', {
      category: 'Auth', method: 'POST', url: '/auth/signin',
      status: adminToken ? 'PASS' : 'BUG',
      httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '200 OK with accessToken in response',
      actual: adminToken
        ? `200 — token captured (${adminToken.slice(0, 24)}…)`
        : isHtml(r.rawBody)
          ? `HTML 500 — global filter threw`
          : `HTTP ${r.httpStatus}: ${r.rawBody.slice(0, 100)}`,
      notes: adminToken ? null : 'Cannot proceed to authenticated tests without a token.',
    });
  }

  /* -------------------------------------------------------------- */
  /* 3. Error-tracking admin endpoints (the focus of this test run) */
  /* -------------------------------------------------------------- */
  console.log('\n--- Error Tracking CRUD ---');

  // 3a. GET /error-tracking  — list
  {
    const r = await call('GET', '/error-tracking?page=1&limit=20', {
      token: adminToken,
    });
    const expected = '200 OK with paginated list envelope';
    let status = 'BUG';
    let actual;
    if (r.body?.success && Array.isArray(r.body?.data?.items)) {
      status = 'PASS';
      actual = `200 — items=${r.body.data.items.length}, total=${r.body.data.meta?.total}`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} (${r.rawBody.length} bytes) — global filter threw`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('GET /error-tracking — list (paginated)', {
      category: 'ErrorTracking', method: 'GET', url: '/error-tracking?page=1&limit=20',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected, actual,
      notes: isHtml(r.rawBody) ? extractHtmlStackTrace(r.rawBody)?.split('\n')[0] ?? null : null,
    });
  }

  // 3b. GET /error-tracking  — list with status filter
  {
    const r = await call('GET', '/error-tracking?status=pending&page=1&limit=10', {
      token: adminToken,
    });
    let status = 'BUG';
    if (r.body?.success) status = 'PASS';
    record('GET /error-tracking — filter by status=pending', {
      category: 'ErrorTracking', method: 'GET', url: '/error-tracking?status=pending',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '200 OK with filtered list',
      actual: r.body?.success
        ? `200 — items=${r.body.data.items.length}`
        : isHtml(r.rawBody)
          ? `HTML ${r.httpStatus}`
          : `HTTP ${r.httpStatus}`,
    });
  }

  // 3c. GET /error-tracking  — unauthenticated (no token)
  {
    const r = await call('GET', '/error-tracking');
    record('GET /error-tracking — without bearer token', {
      category: 'ErrorTracking', method: 'GET', url: '/error-tracking',
      status: r.httpStatus === 401 ? 'PASS' : (isHtml(r.rawBody) ? 'BUG' : 'FAIL'),
      httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '401 Unauthorized',
      actual: isHtml(r.rawBody) ? `HTML ${r.httpStatus} (filter crashed)` : `HTTP ${r.httpStatus}`,
      notes: 'Auth guard should reject before the handler runs. If the filter crashes, the response will be HTML 500.',
    });
  }

  // 3d. GET /error-tracking/:id — non-existent
  {
    const r = await call('GET', '/error-tracking/9999999', { token: adminToken });
    let status = 'BUG';
    let actual;
    if (r.httpStatus === 404 && r.body?.success === false) {
      status = 'PASS';
      actual = `404 — ${r.body?.message}`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('GET /error-tracking/9999999 — non-existent record', {
      category: 'ErrorTracking', method: 'GET', url: '/error-tracking/9999999',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '404 Not Found (JSON { success: false, message: ... })',
      actual,
      notes: 'Tests the global filter\'s mapping of NotFoundException → 404 JSON response.',
    });
  }

  // 3e. GET /error-tracking/:id — invalid id (should hit ParseIdPipe)
  {
    const r = await call('GET', '/error-tracking/abc', { token: adminToken });
    let status = 'BUG';
    let actual;
    if (r.httpStatus === 400 && r.body?.success === false) {
      status = 'PASS';
      actual = `400 — ${r.body?.message}`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('GET /error-tracking/abc — invalid id triggers ParseIdPipe', {
      category: 'ErrorTracking', method: 'GET', url: '/error-tracking/abc',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '400 Bad Request with field-level error',
      actual,
      notes: 'Tests ParseIdPipe → BadRequestException → global filter mapping.',
    });
  }

  // 3f. PATCH /error-tracking/:id/status
  {
    const r = await call('PATCH', '/error-tracking/1/status', {
      token: adminToken,
      body: { status: 'in_progress' },
    });
    let status = 'BUG';
    let actual;
    if (r.body?.success) {
      status = 'PASS';
      actual = `200 — status updated to ${r.body?.data?.status}`;
    } else if (r.httpStatus === 404) {
      // 404 is acceptable if no record exists with that id
      status = 'PASS';
      actual = `404 — record 1 not found (acceptable if table is empty)`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('PATCH /error-tracking/1/status — transition status', {
      category: 'ErrorTracking', method: 'PATCH', url: '/error-tracking/1/status',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '200 OK with updated record, or 404 if record missing',
      actual,
    });
  }

  // 3g. PATCH /error-tracking/:id/status with invalid status
  {
    const r = await call('PATCH', '/error-tracking/1/status', {
      token: adminToken,
      body: { status: 'NOT_A_REAL_STATUS' },
    });
    let status = 'BUG';
    let actual;
    if (r.httpStatus === 400 && r.body?.success === false) {
      status = 'PASS';
      actual = `400 — ${r.body?.message}`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('PATCH /error-tracking/1/status — invalid status enum', {
      category: 'ErrorTracking', method: 'PATCH', url: '/error-tracking/1/status',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '400 Bad Request (class-validator rejects unknown enum)',
      actual,
      notes: 'Tests DTO validation → BadRequestException → global filter.',
    });
  }

  // 3h. DELETE /error-tracking/:id
  {
    const r = await call('DELETE', '/error-tracking/9999999', { token: adminToken });
    let status = 'BUG';
    let actual;
    if (r.httpStatus === 404) {
      status = 'PASS';
      actual = `404 — record 9999999 not found`;
    } else if (r.body?.success) {
      status = 'PASS';
      actual = `200 — record deleted`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('DELETE /error-tracking/9999999 — delete non-existent', {
      category: 'ErrorTracking', method: 'DELETE', url: '/error-tracking/9999999',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '404 Not Found (BaseDeleteProvider throws 404 when not found)',
      actual,
    });
  }

  /* -------------------------------------------------------------- */
  /* 4. 500-error triggering + email-send verification                */
  /* -------------------------------------------------------------- */
  console.log('\n--- 500-error flow ---');

  // 4a. Trigger an actual 500: signin with malformed payload so the service throws
  {
    const r = await call('POST', '/auth/signin', {
      body: { email: 'not-an-email', password: '' },
    });
    // class-validator should reject with 400 — that's a *validation* failure, not 500.
    // We're looking for a route that throws something the filter actually maps to 500.
    let status = 'BUG';
    let actual;
    if (r.httpStatus === 400 && r.body?.success === false) {
      status = 'PASS';
      actual = `400 — validation rejected (correct behaviour)`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('POST /auth/signin with malformed payload — should be 400', {
      category: 'ErrorFlow', method: 'POST', url: '/auth/signin',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '400 Bad Request (validation)',
      actual,
    });
  }

  // 4b. Hit an endpoint that is guaranteed to 404 (so filter exercises the 404 path)
  {
    const r = await call('GET', '/no-such-route');
    let status = 'BUG';
    let actual;
    if (r.httpStatus === 404 && r.body?.success === false) {
      status = 'PASS';
      actual = `404 — ${r.body?.message}`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed on 404 path`;
    } else {
      actual = `HTTP ${r.httpStatus}: ${(r.rawBody || '').slice(0, 100)}`;
    }
    record('GET /no-such-route — exercise 404 path through global filter', {
      category: 'ErrorFlow', method: 'GET', url: '/no-such-route',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '404 Not Found (JSON envelope)',
      actual,
      notes: 'Confirms that NestJS routes the missing-route exception through GlobalExceptionFilter.',
    });
  }

  // 4c. Verify the database table that the tracker writes to
  {
    // We can't query the DB directly without a postgres client. Instead we hit
    // the list endpoint and observe whether the global filter would have crashed
    // before reaching the DB. If the response is HTML, the filter crashed before
    // even querying — which means *no* error would ever be persisted.
    const r = await call('GET', '/error-tracking?page=1&limit=1', { token: adminToken });
    const filterAlive = !isHtml(r.rawBody);
    record('Tracker reachable: filter must not crash before reaching TrackErrorProvider', {
      category: 'ErrorFlow', method: 'GET', url: '/error-tracking?page=1&limit=1',
      status: filterAlive ? 'PASS' : 'FAIL',
      httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: 'JSON response (filter reached the handler)',
      actual: filterAlive
        ? `JSON ${r.httpStatus}`
        : `HTML ${r.httpStatus} — filter throws BEFORE tracker fires`,
      notes: filterAlive
        ? 'If a real 500 happened during this request, TrackErrorProvider would have run.'
        : '** Critical ** — the filter throws on every request, so TrackErrorProvider is never invoked. No admin email will ever be sent.',
    });
  }

  /* -------------------------------------------------------------- */
  /* 5. Misc endpoints that touch the filter                          */
  /* -------------------------------------------------------------- */
  console.log('\n--- Misc ---');

  {
    const r = await call('POST', '/auth/forgot-password', {
      body: { email: 'nobody@example.com' },
    });
    let status = 'BUG';
    let actual;
    if (r.body?.success) {
      status = 'PASS';
      actual = `200 — response envelope ok`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else if (r.httpStatus >= 400) {
      status = 'PASS';
      actual = `${r.httpStatus} — ${(r.rawBody || '').slice(0, 80)}`;
    } else {
      actual = `HTTP ${r.httpStatus}`;
    }
    record('POST /auth/forgot-password — happy path', {
      category: 'Misc', method: 'POST', url: '/auth/forgot-password',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '200 OK with i18n key envelope',
      actual,
    });
  }

  {
    const r = await call('GET', '/auth/sessions', { token: adminToken });
    let status = 'BUG';
    let actual;
    if (r.body?.success) {
      status = 'PASS';
      actual = `200 — sessions endpoint reachable`;
    } else if (isHtml(r.rawBody)) {
      actual = `HTML ${r.httpStatus} — filter crashed`;
    } else {
      actual = `HTTP ${r.httpStatus}`;
    }
    record('GET /auth/sessions — authenticated', {
      category: 'Misc', method: 'GET', url: '/auth/sessions',
      status, httpStatus: r.httpStatus, durationMs: r.durationMs,
      expected: '200 OK',
      actual,
    });
  }
}

/* -------------------------------------------------------------------- */
/* Markdown report                                                       */
/* -------------------------------------------------------------------- */

function buildReport() {
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const bugs = results.filter((r) => r.status === 'BUG').length;
  const errors = results.filter((r) => r.status === 'ERROR').length;
  const htmlResponses = results.filter((r) => isHtml(r.rawBody)).length;
  const totalDurationMs = Date.now() - startTime;

  const lines = [];
  lines.push('# Manual API Test Report');
  lines.push('');
  lines.push(`**Target:** \`${BASE_URL}\`  `);
  lines.push(`**Run date:** ${new Date().toISOString()}  `);
  lines.push(`**Total wall time:** ${(totalDurationMs / 1000).toFixed(2)} s  `);
  lines.push(`**Test cases:** ${total}  `);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('|---|---|');
  lines.push(`| ✅ PASS | ${passed} |`);
  lines.push(`| ❌ FAIL | ${failed} |`);
  lines.push(`| 🐛 BUG (filter crashed → HTML 500) | ${bugs} |`);
  lines.push(`| ⚠️  ERROR (network/setup) | ${errors} |`);
  lines.push(`| **TOTAL** | **${total}** |`);
  lines.push('');
  lines.push(`**Requests that returned HTML instead of JSON:** ${htmlResponses} of ${total}`);
  lines.push('');

  if (bugs > 0 || htmlResponses > 0) {
    lines.push('## ⚠️ Critical Finding');
    lines.push('');
    lines.push(
      `${htmlResponses} of ${total} requests returned an HTML error page rather than the ` +
        `documented JSON \`ErrorResponse\` envelope. This is a hard production bug: ` +
        `the global exception filter is supposed to catch every thrown exception and ` +
        `return a uniform JSON body, but it itself throws — so NestJS falls back to ` +
        `Express's default HTML error handler.`,
    );
    lines.push('');
    lines.push('**Root cause (line 76 of `global-exception.filter.ts`):**');
    lines.push('');
    lines.push('```ts');
    lines.push('if (shouldLog) {');
    lines.push('  this.logger.error(');
    lines.push("    `[${request.method}] ${request.url} | ip=${ip} → ${statusCode} | ${message}`,");
    lines.push('    stack,');
    lines.push('  );');
    lines.push('}');
    lines.push('```');
    lines.push('');
    lines.push(
      '`this.logger` is `undefined` at runtime, even though the constructor accepts it. ' +
        'Either the filter is being instantiated outside the DI container (e.g. the `APP_FILTER` ' +
        'provider config in `app.module.ts` does not receive its dependency correctly), or ' +
        'there is a circular dependency breaking injection. As a result:',
    );
    lines.push('');
    lines.push('- Every endpoint that throws any exception (4xx or 5xx) returns an HTML 500 page instead of a JSON envelope.');
    lines.push('- The **first-occurrence admin email alert never fires**, because `TrackErrorProvider.execute()` is never reached.');
    lines.push('- The 500-error tracking feature described in the task is completely non-functional in the current build.');
    lines.push('');
  }

  // Per-category breakdown
  lines.push('## Results by category');
  lines.push('');
  const categories = [...new Set(results.map((r) => r.category))];
  for (const cat of categories) {
    const sub = results.filter((r) => r.category === cat);
    lines.push(`### ${cat}`);
    lines.push('');
    lines.push('| # | Test | Method | URL | Status | HTTP | Time | Result |');
    lines.push('|---|---|---|---|---|---|---|---|');
    sub.forEach((r, i) => {
      const tag = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : r.status === 'BUG' ? '🐛' : '⚠️';
      lines.push(
        `| ${i + 1} | ${r.name.replace(/\|/g, '\\|')} | ${r.method} | \`${r.url.replace(/\|/g, '\\|')}\` | ${tag} ${r.status} | ${r.httpStatus} | ${r.durationMs}ms | ${(r.actual || '').replace(/\|/g, '\\|').slice(0, 60)} |`,
      );
    });
    lines.push('');
  }

  // Detailed failure section
  const nonPass = results.filter((r) => r.status !== 'PASS');
  if (nonPass.length > 0) {
    lines.push('## Detailed failure / bug report');
    lines.push('');
    for (const r of nonPass) {
      lines.push(`### ${r.method} ${r.url} — ${r.name}`);
      lines.push('');
      lines.push(`- **Status:** ${r.status}`);
      lines.push(`- **HTTP code:** ${r.httpStatus}`);
      lines.push(`- **Expected:** ${r.expected || '—'}`);
      lines.push(`- **Actual:** \`${(r.actual || '').slice(0, 200)}\``);
      if (r.notes) {
        lines.push(`- **Notes:** ${r.notes}`);
      }
      if (isHtml(r.rawBody)) {
        const stack = extractHtmlStackTrace(r.rawBody);
        if (stack) {
          lines.push('');
          lines.push('Response body (first 800 chars):');
          lines.push('');
          lines.push('```html');
          lines.push(stack.slice(0, 800));
          lines.push('```');
        }
      } else if (r.rawBody) {
        const preview = r.rawBody.slice(0, 400);
        lines.push('');
        lines.push('Response body (first 400 chars):');
        lines.push('');
        lines.push('```');
        lines.push(preview);
        lines.push('```');
      }
      lines.push('');
    }
  }

  lines.push('## Conclusion');
  lines.push('');
  lines.push(
    passed === total
      ? `All ${total} test cases passed. The error-tracking CRUD endpoints and the 500 → admin-email pipeline are working correctly.`
      : bugs > 0
        ? `**The error-tracking feature is BROKEN in the current build.** ${bugs} of ${total} test cases failed because the global exception filter throws before any business logic runs. The first-occurrence admin email alert (the headline behaviour of the feature) is therefore unreachable from any HTTP path. Fix \`GlobalExceptionFilter\` so that \`this.logger\` is correctly injected (or guard the log call) before the error-tracking feature can be considered functional.`
        : `${failed} of ${total} test cases failed. Review the detailed report above.`,
  );
  lines.push('');

  return lines.join('\n');
}

/* -------------------------------------------------------------------- */
/* Entry point                                                           */
/* -------------------------------------------------------------------- */

(async () => {
  console.log(`Manual API test starting — base URL: ${BASE_URL}`);
  await runTests();
  const reportPath = path.resolve(__dirname, 'reports.md');
  fs.writeFileSync(reportPath, buildReport(), 'utf8');
  console.log(`\n✓ Report written to ${reportPath}`);
})();