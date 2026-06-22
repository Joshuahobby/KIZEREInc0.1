# AGENTS.md — KIZERE Platform

Full-stack lost-and-found platform for Rwanda (ESM). React 18 + TypeScript (Vite) · Express.js · PostgreSQL (Drizzle ORM + Neon serverless + local PG) · Firebase Auth + Passport.js sessions · PawaPay (mobile money) · Resend (email) · Cloudinary (images) · i18next (en/fr/rw/sw) · Socket.IO (WebSocket) · Sentry + PostHog (monitoring)

## Commands

```bash
npm run dev          # tsx watch server/index.ts, port 5000
npm run build        # vite build (client) + esbuild bundle (server → dist/server.js)
npm run start        # NODE_ENV=production node dist/server.js
npm run check        # tsc (no emit, excludes **/*.test.ts). Run before committing.
npm run db:push      # drizzle-kit push — apply schema changes

# Unit tests (Vitest, jsdom, globals: true — setup at client/src/test/setup.ts)
npm run test                                                    # All unit tests
npx vitest run server/services/report-matching.test.ts         # Single file
npx vitest run -t "exact test name"                            # By name

# E2E tests (Playwright, Chromium, auto-starts dev server)
npm run test:e2e
npx playwright test tests/e2e/auth.spec.ts                     # Single spec
npx playwright test -g "should register"                       # By name

# CI pipeline order (runs on main/staging, push + PR):
# npm ci → npm run check → npm run test → npx drizzle-kit push --force → npx tsx scripts/seed-roles.ts && npx tsx scripts/seed.ts → npx playwright install --with-deps chromium → npm run test:e2e → npm run build
# CI requires a PostgreSQL service container — the DB must be pushed + seeded before E2E.
```

## Architecture

```
client/src/           React SPA (wouter router — not react-router)
  components/ui/      shadcn/ui primitives — do not edit manually
  pages/              Lazy-loaded via lazyWithRetry() in App.tsx
  hooks/              Custom hooks (use-auth, use-toast, use-debounce, etc.)
  lib/                api.ts (apiGet/apiPost/apiPut/apiDelete) + queryClient.ts + firebase.ts
server/
  routes.ts           Central router — imports all 23 domain routers from routes/
  routes/             Domain route modules (*.routes.ts) — one Router per domain
  services/           Business logic — static method classes (*.service.ts)
  storage.ts          DatabaseStorage facade — only DB access point (anti-pattern to query Drizzle directly)
  storage/            Concrete DB query files (*.storage.ts)
  repositories/       BaseRepository<T,InsertT,IdType> + UserRepository
  middleware/         auth, security, rate-limit, audit, permissions
  controllers/        auth-callback.controller.ts (Firebase OAuth landing)
  cron/               Scheduled jobs (skipped on Vercel via env detection)
  websocket.ts        Socket.IO — real-time notifications (reuses Express sessionMiddleware from auth.ts)
shared/schema.ts      Single source of truth: Drizzle tables + Zod schemas + TS types (29 tables)
tests/e2e/            Playwright specs (20 files)
scripts/              seed-roles.ts, seed.ts — run before E2E in CI
```

## Key Architecture Facts

- **DB**: Both Neon serverless and local PostgreSQL supported — auto-detected via `DATABASE_URL` in `server/db.ts`
- **All DB access** through `storage.ts` facade → `storage/*.storage.ts`. No direct Drizzle queries in handlers.
- **Services**: static methods only (`UserService.getUserById(id)`). Not instantiated.
- **Auth**: Firebase (Google OAuth) + Passport.js local (email+password) → same session. 2FA via OTP. CSRF double-token globally.
- **Retailer/POS auth**: separate path — `/api/pos` and `/api/consumer` use `retailer-auth.middleware.ts` (not `requireAuth`). Webhooks bypass auth entirely.
- **Fine-grained permissions**: `checkPermission(permissionType)` from `server/middleware/permissions.ts` — 5-min in-memory cache.
- **Client state**: TanStack Query (`staleTime: Infinity`, `retry: false`). Auth via `useAuth()` context. No Redux/Zustand.
- **Monitoring**: Sentry + PostHog initialized in both `client/src/main.tsx` and `server/index.ts`.
- **Route auth**: `app.use('/api/items', requireAuth, itemRoutes)`. Most domain routes gated by role middleware.

## Path Aliases

- `@/*` → `client/src/*` (tsconfig + vite)
- `@shared/*` → `shared/*` (tsconfig + vite)
- `@assets` → `attached_assets/` (Vite only)

## Style & Conventions

- Double quotes, 2-space indent, no ESLint/Prettier — rely on `npm run check`
- `import type { X }` for type-only. Group: external → path-alias → relative
- Files: kebab-case for server (`item.routes.ts`); PascalCase for React components
- All shared types in `shared/schema.ts` — never duplicate. Enums as `const` arrays.
- Error classes (from `server/utils/error-handler.ts`): `AppError`, `DatabaseError`→500, `AuthenticationError`→401, `AuthorizationError`→403, `NotFoundError`→404, `ValidationError`→400
- Logger: `createLogger('ModuleName')` per file; `debug` suppressed in prod
- Auth middleware: `requireAuth`, `requireAdmin`, `requireAdminOrAgent`, `requireAgent`, `requireRole(roles[])`
- i18n: en/fr/rw/sw in `client/src/lib/i18n/locales/`. Add keys to all 4. Run `node audit-locales.cjs` to check coverage. `t(key, defaultOrOptions?, options?)`.

## Testing

- **Vitest**: test files as `*.test.ts` siblings or in `__tests__/`. Use `vi.mock()` at module level. Always `vi.clearAllMocks()` in `beforeEach`. Wrap React in `QueryClientProvider`(retry:false) + `LanguageProvider` + `TooltipProvider`. Use `@testing-library/react` + `@testing-library/jest-dom`.
- **Playwright E2E**: `tests/e2e/`. Use `getByRole`/`locator`. Random IDs for test data. Lifecycle tests: `test.setTimeout(150000)`. CI admin creds: `ADMIN_USERNAME=admin ADMIN_PASSWORD=Password123!`. DB must be pushed + seeded before first run.

## Environment

- Copy `.env.example` → `.env`. Minimum: `DATABASE_URL`, `SESSION_SECRET`, `FIREBASE_*` keys.
- `MOCK_PAYMENTS=true` to skip real PawaPay calls in dev.
- Replit: runs port 5000 via `npm run dev` (see `.replit`).
