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
npm run test
npx vitest run server/services/report-matching.test.ts  # Single file
npx vitest run -t "exact test name"                     # By name

# E2E tests (Playwright, auto-starts dev server)
npm run test:e2e
npx playwright test tests/e2e/auth.spec.ts
npx playwright test --ui
```

## Architecture

### Monorepo Layout

```
client/src/     React SPA — pages (lazy-loaded), components, hooks, lib
server/         Express API — routes, services, repositories, middleware
shared/         schema.ts — single source of truth: Drizzle tables + Zod schemas + TS types
tests/e2e/      Playwright specs
```

### Data Flow

1. **`shared/schema.ts`** defines all 29 DB tables. Never duplicate type definitions elsewhere.
2. **`server/storage.ts`** is the data-access facade (delegates to `server/storage/*.storage.ts`).
3. **Service classes** (`server/services/*.service.ts`) hold business logic, call `storage.*`.
4. **Route handlers** (`server/routes/*.routes.ts`) validate with Zod, call services, respond.
5. **`server/routes.ts`** registers all routers: `app.use('/api/items', requireAuth, itemRoutes)`.
6. **Client** calls API via helpers in `client/src/lib/api.ts` (`apiGet`, `apiPost`, etc.) wrapped in TanStack Query hooks.

### Auth

Two auth paths merge into the same session:
- **Firebase** (Google OAuth) → `server/routes/auth-callback.controller.ts` → creates/links DB user
- **Local** (email+password) → Passport.js local strategy in `server/auth.ts`

2FA is handled via OTP (email/SMS). Session persists in DB. CSRF double-token pattern is applied globally.

### Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

### Key Architectural Decisions

- **`storage.ts` facade** — all DB access goes through here; direct Drizzle queries in route handlers are an anti-pattern.
- **Static service methods** — services are not instantiated; call `UserService.getUserById(id)`.
- **`components/ui/`** — shadcn/ui primitives, auto-generated; never edit manually.
- **Lazy pages** — all page components are wrapped with `lazyWithRetry()` in `App.tsx`.
- **Roles** — `requireRole(roles[])` middleware; shortcuts `requireAuth`, `requireAdmin`, `requireAdminOrAgent`, `requireAgent`.
- **Cron jobs** — skipped automatically on Vercel (detected via env).
- **Payments** — set `MOCK_PAYMENTS=true` in dev to skip PawaPay API calls.
- **Logging** — always `createLogger('ContextName')` per file; `debug` is suppressed in production.

## Environment Setup

Copy `.env.example` → `.env`. Required for local dev:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — any random string
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK

Optional/stubbed in dev: `RESEND_API_KEY`, `PAWAPAY_API_TOKEN`, `CLOUDINARY_*`, `PINDO_API_TOKEN`.
