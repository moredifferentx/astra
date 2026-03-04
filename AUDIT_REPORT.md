# AstraNodes — Full Codebase Audit Report

**Date:** $(date)
**Scope:** All backend and frontend source files, config, SQL, scripts, deployment

---

## 1. CRITICAL ERRORS

These will cause crashes, broken features, or data loss.

---

### 1.1 Tickets tables not created during auto-migration

**Files:** `backend/src/db/migrate.js`, `backend/src/db/init.sql`
**Impact:** ALL ticket routes crash with "no such table" on fresh install

The `tickets` and `ticket_messages` tables are defined in a **separate** `backend/src/db/tickets.sql` file, which is only executed by the **manual** script `backend/scripts/migrateTickets.js`. Neither `init.sql` nor `migrate.js` creates these tables.

On first server start, any request to `/api/tickets/*` or `/api/admin/tickets/*` will throw an unrecoverable SQLite error.

**Fix:** Add the tickets table creation to `migrate.js`:
```js
// In migrate.js, after running init.sql:
const ticketsSql = fs.readFileSync(path.join(__dirname, "tickets.sql"), "utf-8")
for (const stmt of ticketsSql.split(";")) {
  if (stmt.trim()) await runSync(stmt).catch(() => {})
}
```

Also run the upgrade columns from `tickets-upgrade.sql` (priority, username, email, image columns).

---

### 1.2 Badge component API mismatch in AdminTickets.jsx

**File:** `frontend/src/pages/AdminTickets.jsx` line 146
**Impact:** Ticket status badges render as **empty/invisible** in admin tickets list

```jsx
// AdminTickets.jsx line 146 — WRONG
<Badge variant={ticket.status === 'open' ? 'success' : 'default'}>
  {ticket.status}
</Badge>
```

But `Badge.jsx` accepts `label` (not children) and `tone` (not `variant`):
```jsx
// Badge.jsx
export default function Badge({ label, tone = "info" }) {
  return <span className={...}>{label}</span>
}
```

**Fix:**
```jsx
<Badge label={ticket.status} tone={ticket.status === 'open' ? 'success' : 'info'} />
```

---

### 1.3 VerifyEmail.jsx — double `/api` in URL

**File:** `frontend/src/pages/VerifyEmail.jsx` lines 7, 33, 64
**Impact:** Email verification completely broken when `VITE_API_URL` env var is set

```js
// Line 7 — uses VITE_API_URL as base (which includes "/api" per api.js convention)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Line 33 — adds "/api" again
const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);

// Line 64 — same double-api
const response = await fetch(`${API_URL}/api/auth/resend-verification`, { ... });
```

If `VITE_API_URL = "http://host:4000/api"` (the standard convention), URLs become `http://host:4000/api/api/auth/verify-email` — 404.

**Fix:** Either use the shared `api.js` module, or remove `/api` prefix:
```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// Then: `${API_URL}/auth/verify-email?token=${token}`
```

---

### 1.4 Ticket category constraint mismatch — "General Inquiry" accepted by API but rejected by DB

**Files:** `backend/src/routes/tickets.js` line 28, `backend/src/db/tickets.sql` line 5
**Impact:** Creating a ticket with "General Inquiry" crashes with SQLite CHECK constraint violation

```js
// tickets.js — Zod validation allows 5 categories:
z.enum(["Billing", "Server Issue", "Bug", "Other", "General Inquiry"])
```

```sql
-- tickets.sql — DB allows only 4:
CHECK (category IN ('Billing', 'Server Issue', 'Bug', 'Other'))
```

**Fix:** Either add `'General Inquiry'` to the SQL CHECK constraint, or remove it from the Zod enum.

---

### 1.5 SVG favicon upload: validation accepts it, multer rejects it

**Files:** `backend/src/routes/adminSettings.js` line 138, `backend/src/middleware/uploadSiteAssets.js` lines 14-23
**Impact:** Admin uploads an SVG favicon → multer silently rejects it with "Invalid file type" before the route handler ever runs

```js
// adminSettings.js line 138 — accepts SVG:
if (!["ico", "png", "svg"].includes(ext || "")) {
  return fail(res, "Favicon must be .ico, .png, or .svg", 400)
}
```

```js
// uploadSiteAssets.js — SVG intentionally excluded from ALLOWED_MIMETYPES:
const ALLOWED_MIMETYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/x-icon", "image/vnd.microsoft.icon"
  // SVG intentionally excluded — SVG files can contain embedded JavaScript/XSS
])
```

The multer fileFilter rejects the upload before the route handler runs. The "must be .ico, .png, or .svg" message is misleading — SVG will never succeed.

**Fix:** Either:
- Add `"image/svg+xml"` to `ALLOWED_MIMETYPES` and `.svg` to `ALLOWED_EXTENSIONS` (but sanitize SVG content), OR
- Remove `"svg"` from the adminSettings validation message to avoid confusion

---

## 2. HIGH-PRIORITY WARNINGS

Not immediate crashes, but will cause user-facing problems.

---

### 2.1 Hardcoded Vite favicon in index.html

**File:** `frontend/index.html` line 6
**Impact:** Every page briefly shows the Vite logo on initial load, even though the app dynamically replaces it via `AppUIContext.jsx`

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

The file `frontend/public/vite.svg` exists and is the default Vite logo. While `AppUIContext` dynamically replaces the favicon after the JS bundle loads, there's a visible flash of the wrong icon. If the JS bundle fails to load, the Vite logo persists permanently.

**Fix:** Replace `vite.svg` with a proper default favicon, or use a generic placeholder:
```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

---

### 2.2 Global Adsterra popunder script on ALL pages

**File:** `frontend/index.html` line 15
**Impact:** Popup/popunder ads trigger on login, registration, admin panel, support pages — not just the coin-earning page

```html
<!-- Adsterra Popunder - Loads globally, only once -->
<script src="https://pl28771198.effectivegatecpm.com/.../invoke.js"></script>
```

The BannerAd and NativeAd components are correctly sandboxed in iframes (only on `/coins`), but this popunder script is global and fires on every visit.

**Fix:** Either conditionally load this script only on the `/coins` page (via a React component), or remove it entirely if the sandboxed ads are sufficient.

---

### 2.3 `logo_path` column not in init.sql or migrate.js

**Files:** `backend/src/db/init.sql` (site_settings table), `backend/src/routes/adminSettings.js` lines 27-31
**Impact:** On fresh install, `logo_path` column doesn't exist until admin settings page is first loaded

The column is added at runtime via:
```js
// adminSettings.js
async function ensureSettingsRow() {
  if (!_migrationDone) {
    try {
      await runSync("ALTER TABLE site_settings ADD COLUMN logo_path TEXT DEFAULT ''")
    } catch { /* column already exists */ }
    _migrationDone = true
  }
}
```

The public `settings.js` route uses `SELECT *` and accesses `data.logo_path`, which will be `undefined` (not an error) if the column doesn't exist yet. Graceful degradation, but fragile.

**Fix:** Add the column to `init.sql`:
```sql
CREATE TABLE IF NOT EXISTS site_settings (
  ...
  logo_path TEXT DEFAULT '',
  ...
);
```

Or add it to `migrate.js`:
```js
try {
  await runSync("ALTER TABLE site_settings ADD COLUMN logo_path TEXT DEFAULT ''")
} catch {}
```

---

### 2.4 Password reset feature non-functional for OAuth-only users

**Files:** `frontend/src/pages/AccountSettings.jsx`, `backend/src/routes/auth.js`
**Impact:** The "Reset Password" button exists but will always fail for all users

The app uses OAuth-only authentication (Google + Discord). Email/password registration is disabled. OAuth users have `password_hash = NULL` in the database. The reset endpoint verifies `currentPassword` against the stored hash — which doesn't exist.

**Fix:** Either hide the password reset UI for OAuth users:
```jsx
{user?.oauth_provider ? null : <button onClick={() => setPasswordModalOpen(true)}>Reset Password</button>}
```
Or remove the feature entirely.

---

### 2.5 No `username` column or field — Dashboard always shows "User"

**Files:** `frontend/src/pages/Dashboard.jsx` line 63, `backend/src/routes/auth.js` `/me` and `/exchange` endpoints
**Impact:** Dashboard greeting always says "Welcome back, User" instead of the actual name

```jsx
// Dashboard.jsx
const userName = user?.username || "User"
```

The `users` table has no `username` column. Neither `/api/auth/me` nor `/api/auth/exchange` returns a `username` field. The localStorage `user` object never has `username`.

**Fix:** Either:
- Derive a display name from the email (e.g., `user.email.split('@')[0]`)
- Add a `username` column to the users table and populate from OAuth profile
- Or simply show the email

---

### 2.6 Inconsistent API URL construction in TicketDetail.jsx and AdminTicketDetail.jsx

**Files:** `frontend/src/pages/TicketDetail.jsx` line 20, `frontend/src/pages/AdminTicketDetail.jsx` line 31
**Impact:** Image URLs may be constructed incorrectly depending on VITE_API_URL format

Both files define their own `getApiUrl()`:
```js
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace("/api", "")
  ...
}
```

This uses a simple `.replace("/api", "")` which replaces the **first** occurrence. `api.js` exports `getBackendBaseUrl()` which correctly uses regex to strip `/api` from the end only:
```js
export function getBackendBaseUrl() {
  return API_URL.replace(/\/api\/?$/, "")
}
```

**Fix:** Use the shared `getBackendBaseUrl()` from `api.js` instead of duplicated logic.

---

## 3. MEDIUM-PRIORITY WARNINGS

Suboptimal patterns that should be addressed.

---

### 3.1 Invalid Vite config option `historyApiFallback`

**File:** `frontend/vite.config.js` line 13

```js
server: {
  historyApiFallback: true  // This is a webpack-dev-server option, NOT Vite
}
```

Vite silently ignores this. Vite handles SPA routing automatically in dev mode. This misleads developers into thinking the option is doing something.

**Fix:** Remove the property:
```js
server: {}
```
Or add a proxy config if needed.

---

### 3.2 `AccountSettings.jsx` reads user from localStorage once — stale data

**File:** `frontend/src/pages/AccountSettings.jsx`

```jsx
const [user] = useState(() => {
  const stored = localStorage.getItem("user")
  return stored ? JSON.parse(stored) : null
})
```

User data is read once on mount and never refreshed. If the user's role or email changes, the page won't reflect it.

**Fix:** Fetch from `/api/auth/me` like other pages do.

---

### 3.3 Hardcoded Adsterra ad keys in component files

**Files:** `frontend/src/components/BannerAd.jsx`, `frontend/src/components/NativeAd.jsx`

Ad keys and script URLs are hardcoded directly in the component source:
```js
'key': 'b56912540f46f2be44d0b824ad0e3a92'
```

**Fix:** Move to environment variables or fetch from backend ad settings API (which already exists at `/api/ads/coins`).

---

### 3.4 `Topbar.jsx` uses `window.location.href` for logout

**File:** `frontend/src/components/Topbar.jsx`

```js
const handleLogout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/login"
}
```

This causes a full page reload. The `Sidebar.jsx` correctly uses `navigate("/login")` for client-side routing.

**Fix:** Use `useNavigate()` and `navigate("/login")` for consistent SPA behavior.

---

### 3.5 `Diamond` icon missing from AdminPlans.jsx iconMap

**File:** `frontend/src/pages/AdminPlans.jsx`

```jsx
const iconMap = {
  Package, Server, Cpu, HardDrive, Zap, Sparkles, Star, Crown,
  Shield, Rocket, Gift, Gem, Trophy, Circle  // Missing: Diamond
}
```

`AdminPanel.jsx` includes `Diamond` in its iconMap, so plans with `diamond` icon render correctly in the main admin page but fall back to `Package` in the dedicated Plans Manager page.

**Fix:** Add `Diamond` to the import and iconMap in AdminPlans.jsx.

---

### 3.6 Missing tickets-upgrade migration in auto-migration pipeline

**File:** `backend/src/db/tickets-upgrade.sql`

Even if tickets.sql is added to auto-migration (fixing issue 1.1), the `tickets-upgrade.sql` (which adds `priority`, `username`, `email`, and `image` columns) is also not auto-run. These columns are required by the ticket creation route.

**Fix:** Execute tickets-upgrade.sql ALTER TABLE statements in `migrate.js`, wrapped in try/catch like other migrations.

---

### 3.7 `Content-Security-Policy` meta tag in index.html is very permissive

**File:** `frontend/index.html` line 5

```
connect-src 'self' https: wss: ws:;
```

This allows connections to **any** HTTPS endpoint, any WebSocket. While necessary for Adsterra and dynamic API URLs, it weakens CSP significantly.

**Fix:** Restrict to known domains if possible, or accept the trade-off with a comment explaining why.

---

### 3.8 `front/public/ads/adsbygoogle.js` — unused AdSense stub

**File:** `frontend/public/ads/adsbygoogle.js`

This file exists but appears to be an unused stub (the app uses Adsterra, not AdSense). It may confuse developers.

---

## 4. SUGGESTIONS

Non-critical improvements for code quality, security, and maintainability.

---

### 4.1 Token storage security

JWT tokens are stored in `localStorage`, which is accessible to all JavaScript on the page — including the globally-loaded Adsterra popunder script. Consider using httpOnly cookies for token storage to prevent XSS-based token theft.

### 4.2 Consolidate API URL helpers

There are 3 different API URL construction patterns:
1. `api.js` — `getApiUrl()` + exported `getBackendBaseUrl()`
2. `VerifyEmail.jsx` — own `API_URL` without `/api` suffix
3. `Register.jsx` — own `getApiUrl()` function
4. `TicketDetail.jsx` / `AdminTicketDetail.jsx` — own `getApiUrl()` with `.replace()`

All should use the shared `api.js` exports.

### 4.3 Add maintenance mode enforcement on frontend

`AppUIContext.jsx` fetches `maintenanceMode` from settings but doesn't enforce it. No page blocks access during maintenance. The admin can toggle it, but users see no difference.

Consider adding a check in `AppLayout` that shows a maintenance page when `maintenanceMode` is `true` and the user is not an admin.

### 4.4 Database connection pooling

The app uses `better-sqlite3`, which is synchronous and single-process. The PM2 config correctly sets `exec_mode: "fork"` with 1 instance. No issue now, but document that clustering is not possible with SQLite.

### 4.5 Error handler doesn't log in production

**File:** `backend/src/middlewares/errorHandler.js`

```js
export default function errorHandler(err, req, res, _next) {
  console.error(err) // Only console.error, no structured logging
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" })
}
```

Consider adding request context (method, path, user ID) and using a structured logger.

### 4.6 Missing `else` return in several async route handlers

Several routes call `next(error)` in catch blocks without `return`, allowing potential double-response if middleware continues. While `next(error)` generally short-circuits, it's best practice to `return next(error)`.

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| **Critical** | 5 | Missing tickets tables, Badge API mismatch, double-/api URL, category constraint, SVG upload |
| **High** | 6 | Vite favicon, global popunder, missing logo_path migration, dead password reset, no username, inconsistent API URLs |
| **Medium** | 8 | Invalid Vite config, stale data, hardcoded ad keys, logout reload, missing Diamond icon, CSP permissiveness |
| **Suggestions** | 6 | Token security, URL consolidation, maintenance mode, error logging |
