# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Full code style rules, naming conventions, and boilerplate patterns are documented in `AGENTS.md`. Read it before making changes.

## What This Is

KIZERE is a full-stack lost-and-found platform for Rwanda. Users register items, file lost/found reports, and make claims. Businesses/retailers have a POS terminal. Admins manage users, moderate content, and run analytics.

**Stack:** React 18 + TypeScript (Vite) · Express.js · PostgreSQL (Drizzle ORM + Neon) · Firebase Auth + Passport.js sessions · PawaPay (mobile money) · Resend (email) · Cloudinary (images) · i18next (en/fr/rw/sw)

## Commands

```bash
npm run dev          # Hot-reload dev server on port 5000
npm run build        # Vite (client) + esbuild (server → dist/server.js)
npm run start        # Production server
npm run check        # TypeScript type-check — run before committing

npm run db:push      # Apply Drizzle schema changes to DB (Neon)

# Unit tests (Vitest)
npm run test                                                    # All unit tests
npx vitest run server/services/report-matching.test.ts         # Single file
npx vitest run -t "exact test name"                            # By name
npx vitest                                                     # Watch mode

# E2E tests (Playwright, Chromium only, auto-starts dev server)
npm run test:e2e
npx playwright test tests/e2e/auth.spec.ts                     # Single spec
npx playwright test -g "should register"                       # By test name
npx playwright test --ui                                       # Interactive UI

# CI pipeline order:
# npm ci → npm run check → npm run test → playwright install → npm run test:e2e → npm run build
```

## Architecture

### Monorepo Layout

```text
client/src/     React SPA — pages (lazy-loaded), components, hooks, lib, context, providers
server/         Express API
  routes/       Domain route modules (*.routes.ts) — one Router per domain
  services/     Business logic classes with static methods (*.service.ts)
  repositories/ BaseRepository<T,InsertT,IdType> + domain repos; used by services
  storage/      *.storage.ts files — concrete DB queries (called via storage.ts facade)
  storage.ts    DatabaseStorage facade — the only DB access point for routes/services
  middleware/   auth, security, rate-limit, audit, permissions, retailer guards
  controllers/  auth-callback.controller.ts (Firebase OAuth landing)
  cron/         Scheduled jobs (skipped on Vercel via env detection)
  websocket.ts  WebSocket server (real-time notifications)
shared/         schema.ts — single source of truth: Drizzle tables + Zod schemas + TS types
tests/e2e/      Playwright specs
```

### Data Flow

1. **`shared/schema.ts`** defines all DB tables. Never duplicate type definitions elsewhere.
2. **`server/storage.ts`** is the data-access facade (delegates to `server/storage/*.storage.ts`).
3. **Service classes** (`server/services/*.service.ts`) hold business logic, call `storage.*`.
4. **Route handlers** (`server/routes/*.routes.ts`) validate with Zod, call services, respond.
5. **`server/routes.ts`** registers all routers: `app.use('/api/items', requireAuth, itemRoutes)`.
6. **Client** calls API via helpers in `client/src/lib/api.ts` (`apiGet`, `apiPost`, etc.) wrapped in TanStack Query hooks (`staleTime: Infinity`, `retry: false`).

### Auth

Two auth paths merge into the same session:

- **Firebase** (Google OAuth) → `server/controllers/auth-callback.controller.ts` → creates/links DB user
- **Local** (email+password) → Passport.js local strategy in `server/auth.ts`

2FA is handled via OTP (email/SMS). Session persists in DB. CSRF double-token pattern is applied globally.

**Retailer/POS auth** is a separate path: `/api/pos` and `/api/consumer` do **not** use `requireAuth`. They use `retailer-auth.middleware.ts` (which sets `req.retailer`) and are gated by `retailer-subscription.middleware.ts`. Webhooks (`/api/webhooks/*`) bypass auth entirely.

**Fine-grained permissions** beyond roles: `checkPermission(permissionType)` from `server/middleware/permissions.ts` checks the `roles` table with a 5-minute in-memory cache. Permission types are defined in `shared/schema.ts` as `permissionTypes`.

### Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/` (Vite only)

### Key Architectural Decisions

- **`storage.ts` facade** — all DB access goes through here; direct Drizzle queries in route handlers are an anti-pattern.
- **Static service methods** — services are not instantiated; call `UserService.getUserById(id)`.
- **Repositories** — `BaseRepository<T,InsertT,IdType>` in `server/repositories/base.repository.ts`; domain repos extend it and are used inside services for structured CRUD.
- **Error classes** — throw typed errors from `server/utils/error-handler.ts`: `NotFoundError`, `ValidationError`, `AuthenticationError`, `AuthorizationError`, `DatabaseError`. Route handler catches and sends appropriate HTTP status.
- **`components/ui/`** — shadcn/ui primitives, auto-generated; never edit manually.
- **Lazy pages** — all page components are wrapped with `lazyWithRetry()` in `App.tsx`.
- **Roles** — `requireRole(roles[])` middleware; shortcuts `requireAuth`, `requireAdmin`, `requireAdminOrAgent`, `requireAgent`.
- **Cron jobs** — in `server/cron/`; skipped automatically on Vercel (detected via env).
- **Payments** — set `MOCK_PAYMENTS=true` in dev to skip PawaPay API calls.
- **Logging** — always `createLogger('ContextName')` per file; `debug` is suppressed in production.

### i18n

Four locales: **en / fr / rw / sw** — JSON files in `client/src/lib/i18n/locales/`. When adding new UI text:

1. Add the key to **all four** locale files (`en.json`, `fr.json`, `rw.json`, `sw.json`).
2. Use the `useTranslation()` hook (`client/src/lib/i18n/useTranslation.tsx`) to get `t('key')`.
3. Run `node audit-locales.cjs` from the project root to detect missing keys.

`t()` signature: `t(key, defaultOrOptions?, options?)` — the second arg can be a fallback string.

### Code Style Essentials

- Double quotes everywhere; 2-space indentation; no ESLint/Prettier — follow existing file patterns.
- `import type { X }` for type-only imports. Group: external libs → path-aliased → relative.
- All shared types in `shared/schema.ts`. Enums as `const` arrays: `export const userRoles = ['Admin', 'Agent'] as const`.

## Environment Setup

Copy `.env.example` → `.env`. Required for local dev:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — any random string
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK

Optional/stubbed in dev: `RESEND_API_KEY`, `PAWAPAY_API_TOKEN`, `CLOUDINARY_*`, `PINDO_API_TOKEN`.
