# AGENTS.md - KIZERE Platform

## Project Overview

Full-stack lost-and-found platform (ESM package). React 18 + TypeScript frontend (Vite), Express.js backend, PostgreSQL via Drizzle ORM + Neon serverless. Auth: Firebase + Passport sessions. Payments: PawaPay. Email: Resend. Storage: Cloudinary. i18n: i18next (en/fr/rw/sw).

## Commands

```bash
# Development
npm run dev          # tsx watch server/index.ts (hot reload, port 5000)
npm run build        # vite build (client) + esbuild bundle (server → dist/server.js)
npm run start        # NODE_ENV=production node dist/server.js
npm run check        # tsc — type-check only (no emit). Run before committing.
npm run db:push      # drizzle-kit push — apply schema changes to DB

# Unit tests (Vitest, jsdom env, globals: true)
npm run test                                # All unit tests
npx vitest run server/services/report-matching.test.ts  # Single file
npx vitest run -t "exact Unique Identifier"             # By test name pattern
npx vitest                                  # Watch mode

# E2E tests (Playwright, Chromium only, auto-starts dev server)
npm run test:e2e                                    # All E2E specs
npx playwright test tests/e2e/auth.spec.ts          # Single spec file
npx playwright test -g "should register"            # By test name
npx playwright test --ui                            # Interactive UI

# CI pipeline order:
# npm ci → npm run check → npm run test → playwright install → npm run test:e2e → npm run build
```

## Project Structure

```
client/src/         React frontend
  components/ui/    shadcn/ui primitives (do not edit manually)
  pages/            Page components (lazy-loaded)
  hooks/            Custom hooks (use-auth, use-toast, use-debounce, etc.)
  lib/              api.ts, queryClient.ts, protected-route.tsx, utils.ts, firebase.ts, logger.ts
server/             Express backend
  routes/           Domain route modules (*.routes.ts) — Router per domain
  services/         Business logic classes with static methods (*.service.ts)
  repositories/     BaseRepository<T, InsertT, IdType> + UserRepository
  storage.ts        DatabaseStorage facade → delegates to server/storage/*.storage.ts
  middleware/       auth, security, rate-limit, audit, permissions
  utils/            logger.ts, error-handler.ts, cache, firebase-admin, pawapay
shared/schema.ts    Single source of truth: Drizzle tables, Zod schemas, TS types (29 tables)
tests/e2e/          Playwright specs (10 files)
```

## Path Aliases

- `@/*` → `./client/src/*`    (tsconfig + vite)
- `@shared/*` → `./shared/*`  (tsconfig + vite)
- `@assets` → `./attached_assets` (vite only)

## Code Style

### Imports & Formatting
- Double quotes for all strings/imports
- `import type { X }` for type-only imports
- Group: external libs → path-aliased imports → relative imports
- No ESLint/Prettier — follow existing file patterns, rely on `npm run check`
- 2-space indentation throughout

### Naming Conventions
- **Files:** kebab-case for server files (`item.routes.ts`, `email.service.ts`); PascalCase for React components
- **Components:** PascalCase (`ItemRegistrationPage`)
- **Hooks:** `use` prefix, camelCase (`useAuth`, `useDebounce`)
- **Services:** PascalCase class, static methods (`UserService.getUserById()`)
- **Routes:** `const router = Router()`, default export; registered in `server/routes.ts`
- **Middleware:** camelCase functions (`requireAuth`, `requireAdmin`, `requireAdminOrAgent`)
- **Logger contexts:** match class/module name (`createLogger('PaymentService')`, `createLogger('ItemRoutes')`)

### TypeScript & Schema
- `strict: true` with `moduleResolution: "bundler"` and `module: "ESNext"`
- All shared types in `shared/schema.ts` — never duplicate type definitions
- Drizzle tables → `createInsertSchema(table).omit({id, createdAt, ...}).extend({...})` for Zod schemas
- Enums as `const` arrays: `export const userRoles = ['Admin', 'Agent', ...] as const;`
- Types: `export type User = typeof users.$inferSelect;` / `export type InsertUser = z.infer<typeof insertUserSchema>;`

### Server Patterns

**Route files** (`server/routes/*.routes.ts`):
```ts
const logger = createLogger('XxxRoutes');
const router = Router();
router.post("/", async (req, res) => {
  try {
    const validated = insertXxxSchema.parse(req.body);
    const result = await storage.createXxx(validated);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    logger.error("Failed to create xxx", { error });
    res.status(500).json({ message: "Failed to create xxx" });
  }
});
export default router;
```

**Service classes** (`server/services/*.service.ts`):
```ts
const logger = createLogger('XxxService');
export class XxxService {
  static async doSomething(id: number): Promise<Result> {
    try {
      logger.info('Doing something', { id });
      // ... business logic, delegate to storage/repository ...
      return result;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) throw error;
      logger.error('Error doing something', { id, error });
      throw new DatabaseError('Failed to do something');
    }
  }
}
```

**Error classes** (from `server/utils/error-handler.ts`):
- `AppError(message, statusCode=500, code='INTERNAL_ERROR', details?)`
- `DatabaseError(message?, details?)` → 500
- `AuthenticationError(message?, details?)` → 401
- `AuthorizationError(message?, details?)` → 403
- `NotFoundError(resource?, details?)` → 404
- `ValidationError(message?, details?)` → 400

**Logging** — `createLogger(name)` returns `{ debug, info, warn, error }`. Format: `[timestamp] [LEVEL] [name] message meta`. `debug` suppressed in production.

**Auth middleware** — `requireRole(roles)` returns Express middleware. Shortcuts: `requireAuth` (any role), `requireAdmin`, `requireAdminOrAgent`, `requireAgent`.

**Route registration** (`server/routes.ts`): `app.use('/api/items', requireAuth, itemRoutes)`. Webhooks bypass auth.

### Client Patterns

**API calls** — use `apiGet<T>`, `apiPost<T,D>`, `apiPut<T,D>`, `apiDelete<T>` from `@/lib/api.ts`. These handle CSRF tokens, 401 retry, and error toasts automatically. QueryClient: `staleTime: Infinity`, `retry: false`.

**Components** — shadcn/ui in `components/ui/`; use `cn()` from `@/lib/utils` for class merging. CVA for variant styling.

**Pages** — lazy-loaded via `lazyWithRetry()` in `App.tsx` (auto-reloads on chunk errors). Protected with `<ProtectedRoute requiredRole="Admin" />`.

**State** — TanStack Query for server state; React context for auth (`useAuth()`), i18n (`useTranslation()`). No Redux/Zustand.

### Testing Conventions

**Unit tests (Vitest):** co-located in `__tests__/` dirs or `.test.ts` siblings. Mock with `vi.mock()` at module level. Always `vi.clearAllMocks()` in `beforeEach`. Wrap React components in `QueryClientProvider` (retry: false) + `LanguageProvider` + `TooltipProvider`. Use `@testing-library/react` + `@testing-library/jest-dom`.

**E2E tests (Playwright):** in `tests/e2e/`. Use `page.getByRole()` / `page.locator()` for selectors. Random IDs for test data (`Math.floor(Math.random() * 100000)`). Lifecycle tests set `test.setTimeout(150000)`. Suppress modals with `page.addInitScript(() => localStorage.setItem(...))`.
