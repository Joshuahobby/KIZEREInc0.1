# KIZERE Frontend & Completion Plan

All 4 backend revenue sprints are complete. This document captures every remaining
piece of work — ordered by business value and dependency — so we can proceed sprint by sprint.

---

## Phase 0 — POS Housekeeping (prerequisite, 30 min)

Uncommitted changes exist in two POS files. Must be reviewed and committed before
branching off into new work to keep the tree clean.

| Task | File | Notes |
|------|------|-------|
| P0.1 | `barcode-scanner.tsx` | Review diff, verify scanner behaviour, commit |
| P0.2 | `pos-terminal.tsx` | Review diff, verify terminal behaviour, commit |

---

## Phase 1 — Consumer Verification Pay-Gate UI (highest revenue unlock)

Backend: `GET /api/consumer/verify/:id`, `GET /api/consumer/verify/:id/report`,
`POST /api/consumer/verify/:id/purchase` are all live.

No frontend exists yet — users cannot reach these endpoints.

### P1.1 — New page: `/consumer/verify`

**File:** `client/src/pages/consumer-verify-page.tsx`

Flow:
1. **Identifier input** — text field for IMEI / serial / KID
2. **Free summary card** — calls `GET /api/consumer/verify/:id` (public, no auth required)
   - Shows: isRegistered badge, isFlagged alert, status, category
   - "Get Full Report" CTA (locked if not logged in)
3. **Full report panel** (authenticated) — calls `GET /api/consumer/verify/:id/report`
   - 200 → shows owner details, registration date, full history
   - 402 `REPORT_ACCESS_REQUIRED` → triggers purchase modal
4. **Purchase modal** — phone number input → `POST /api/consumer/verify/:id/purchase`
   - On success redirect to `/payment-status?ref=<depositId>&type=verification_report`
   - Idempotency: backend returns `alreadyPurchased: true` if active, skip payment

**P1.2** — Register route in `App.tsx`:
```tsx
<Route path="/consumer/verify">
  <ConsumerVerifyPage />
</Route>
```

**P1.3** — Surface entry points:
- Navbar "Verify Item" link (replace or augment existing `/verify-item`)
- Landing page CTA card
- PublicItemVerifyPage "Get Full Report" button link for logged-in users

---

## Phase 2 — Premium Subscription UI

Backend: `GET /api/consumer/subscription`, `POST /api/consumer/subscription/purchase`,
free-tier cap (3 items) enforced with 402 `PREMIUM_REQUIRED`. No UI yet.

### P2.1 — Subscription status card (dashboard / profile)

**Location:** `client/src/pages/unified-dashboard.tsx` (or a new widget component)

Displays:
- "KIZERE Premium" badge with expiry date if active
- "Free tier — X/3 items registered" progress bar if free
- "Upgrade to Premium" button

### P2.2 — Upgrade modal / flow

**File:** `client/src/components/subscription/PremiumUpgradeModal.tsx`

Triggered by:
- "Upgrade" button from the status card
- 402 `PREMIUM_REQUIRED` response from item registration (see P2.3)

Flow:
1. Show benefits (unlimited registrations, free full reports, priority support)
2. Phone number input → `POST /api/consumer/subscription/purchase`
3. Redirect to `/payment-status?ref=<depositId>&type=consumer_subscription`

### P2.3 — Registration cap gate in item-registration.tsx

**File:** `client/src/pages/item-registration.tsx`

Currently the form would show a generic error on 402.
Change: intercept HTTP 402 + code `PREMIUM_REQUIRED` → open `PremiumUpgradeModal`
instead of showing a destructive toast.

---

## Phase 3 — Ownership Certificate UI

Backend: certificate payment type is wired; no dedicated UI to purchase or view one.

### P3.1 — Certificate button on item detail

**File:** `client/src/pages/item-detail.tsx`

Owner-only panel:
- If certificate payment exists and is confirmed → "View Certificate" button
- If not → "Get Official Certificate — X RWF" button → initiates payment

### P3.2 — Certificate view / download

**File:** `client/src/pages/item-certificate.tsx` (or full-screen modal)

Route: `/items/:id/certificate` (protected, owner only)

Renders a printable certificate card:
- Item name, category, unique identifier
- Owner name, registration date
- KIZERE logo + official seal watermark
- "Download PNG" and "Print" buttons (canvas-based, same pattern as verification card in
  `verification-page.tsx:193`)

---

## Phase 4 — Transfer Fee UI

Backend: `transfer_fee` payment type wired in payment config and webhook; no UI.

### P4.1 — Transfer ownership flow

**Location:** Item detail page (owner-only action panel), new section "Transfer Ownership"

Flow:
1. Search for recipient (by username, email, or phone)
2. Confirm transfer details
3. Pay transfer fee via PawaPay → `POST /api/payments/initiate` with `type: transfer_fee`
4. On confirmed payment, backend triggers ownership change

*(Requires verifying what the server-side webhook handler does for `transfer_fee` — may need
a `finalizeTransfer` service method before the UI is wire-able.)*

---

## Phase 5 — Admin Revenue Analytics

Backend has all payment data; admin panel lacks subscription/report-specific views.

### P5.1 — Revenue breakdown in admin payment dashboard

**File:** `client/src/pages/admin/payment-dashboard.tsx`

Add a "Revenue by Type" section:
- Cards: total from `consumer_subscription`, `verification_report`, `ownership_certificate`,
  `transfer_fee`, `retailer_subscription`
- Active premium users count
- Chart: monthly revenue by type (recharts)

### P5.2 — Active subscriptions table

**File:** `client/src/pages/admin/analytics.tsx` or a new `subscriptions.tsx` admin page

Table: user, premium expiry, registration count, payments made

---

## Phase 6 — i18n Key Completion

All new UI text must be added to all four locale files.

**Files:** `en.json`, `fr.json`, `rw.json`, `sw.json`

Key groups to add:
- `consumer.verify.*` — verify page headings, CTAs, report sections
- `consumer.premium.*` — upgrade modal, benefits list, expiry labels
- `consumer.certificate.*` — certificate page text
- `consumer.transfer.*` — transfer ownership flow text

---

## Phase 7 — E2E Test Coverage

**Dir:** `tests/e2e/`

New Playwright specs:
| Spec file | Covers |
|-----------|--------|
| `consumer-verify.spec.ts` | Free summary → full report → purchase flow |
| `premium-gate.spec.ts` | Register 3 items free → 4th triggers upsell modal → payment |
| `certificate.spec.ts` | Certificate purchase → view → download |
| `transfer.spec.ts` | Transfer ownership → fee payment → new owner sees item |

---

## Execution Order

```
Phase 0  →  Phase 1  →  Phase 2  →  Phase 3  →  Phase 4
                    ↘                              ↗
                     Phase 5 (admin, parallel)

Phase 6 (i18n) — after each phase's UI is written
Phase 7 (E2E)  — after all UI is wired
```

**Phases 1 and 2 are the highest-priority** because they are the direct monetization surface
for the newly deployed Sprint 4 backend.

Phases 3 and 4 depend on verifying the server-side webhook handlers for those payment types
are fully implemented before wiring the UI.
