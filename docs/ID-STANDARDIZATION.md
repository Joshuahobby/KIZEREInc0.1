# KIZERE ID Standardization Plan

## Overview

KIZERE uses three distinct identifier systems, each serving a different domain. This document defines what each ID is, where it lives, how it is generated, how it is displayed, and how it must be used across the codebase. It also covers security, privacy, and theft-prevention considerations for each system.

---

## The Three ID Systems

### 1. `items.uniqueIdentifier` — Lost & Found Item ID

| Property | Value |
|---|---|
| **DB column** | `items.unique_identifier` (text, `NOT NULL`, indexed) |
| **Format** | Free-form string entered by the user (e.g., serial number, IMEI, VIN, passport number, or any owner-assigned tag) |
| **Who sets it** | The item owner at registration time |
| **Uniqueness** | Not enforced by the DB; duplicates are possible (intentional — same physical serial can exist on multiple reports) |
| **Purpose** | Identify a specific physical object in the Lost & Found registry |
| **Public** | YES — exposed via `GET /api/items/public/:uniqueIdentifier` (no auth required) |
| **QR code target** | `/verify/:uniqueIdentifier` |

**Rules:**
- Never use the `items.id` (auto-increment) for public links. Always use `uniqueIdentifier`.
- Never expose `items.id` in QR codes, email links, or UI that a non-admin sees.
- Validate minimum length (3 chars) on entry; reject clearly empty strings.

**Security note:** Because `uniqueIdentifier` is user-supplied and public, it must never be used in any privileged query without first checking the requesting user's ownership or role. The public endpoint (`/verify/`) returns only safe, minimal fields.

---

### 2. `pos_products.serialNumber` — POS Product ID

| Property | Value |
|---|---|
| **DB column** | `pos_products.serial_number` (text, `NOT NULL`, `UNIQUE`) |
| **Format** | Free-form serial number assigned by the retailer or manufacturer |
| **Who sets it** | The retailer at product registration time |
| **Uniqueness** | Enforced globally by a `UNIQUE` constraint (`pos_product_serial_idx`) |
| **Purpose** | Track ownership chain of a specific product sold through the POS network |
| **Public** | YES — the public `/verify/:id` page resolves this via `GET /api/items/public/:id` fallback |
| **QR code target** | `/verify/:serialNumber` |

**Rules:**
- `serialNumber` is the canonical external reference for a POS product — use it in all QR codes, receipts, and public-facing links.
- Never expose `pos_products.id` in QR codes or receipts.
- The public verify endpoint resolves by `serialNumber`, not by DB id.

**Security note:** Because `serialNumber` is globally unique, a valid serial instantly reveals that a product exists in the KIZERE network. This is by design (theft prevention, provenance checking). However, the public verify page must **not** reveal the retailer's internal pricing, margins, or customer details.

---

### 3. `KZR-XXXXXX` — Display Label

| Property | Value |
|---|---|
| **Source** | Computed in the UI/API from `items.id` or `pos_products.id` using `String(id).padStart(6, '0')` |
| **Format** | `KZR-000001` (prefix + zero-padded 6-digit auto-increment id) |
| **Who sets it** | Nobody — it is generated at display time only |
| **Stored in DB** | NEVER |
| **Purpose** | Human-friendly display reference for support tickets, receipts, and admin dashboards |
| **Public** | As a display label only; never used as a lookup key |

**Rules:**
- `KZR-XXXXXX` is **display-only**. It must never appear in API route paths, query parameters, or search logic.
- Do not attempt to look up a record by parsing a `KZR-` prefix; always use the raw `id` for DB queries.
- The format can differ between entity types if needed (e.g., `POS-000001` for POS products) — see Roadmap below.

---

## Current State vs. Target State

| Location | Current | Target | Action Required |
|---|---|---|---|
| L&F item QR code | `/verify/:uniqueIdentifier` | Same | No change |
| POS product QR code | `/verify/:serialNumber` | Same | Done (fixed) |
| `BulkReceiptPrinter` QR | `kizere.rw/verify/:serialNumber` | Same | Done (fixed) |
| Receipt display label | `KZR-XXXXXX` from `items.id` | Same | No change |
| `/api/items/:id/qrcode` | Uses `config.APP_URL` | Same | Done (fixed) |
| Public verify fallback | Checks L&F then POS by serial | Same | Done (wired) |
| Admin commission table | Shows `#XXXXX` from DB id | Same (internal only) | No change |

---

## Privacy and Security Rules

### What is safe to make public
- `items.uniqueIdentifier` — the user chose this; it's the search/verify key
- `pos_products.serialNumber` — the retailer chose this; it's the provenance key
- `KZR-XXXXXX` display label — harmless, conveys no sensitive info

### What must never be public
- `items.id`, `pos_products.id`, `users.id` — auto-increment DB ids expose row count and enumeration vectors
- `users.email`, `users.phone` — never return these from public endpoints (`/verify/`, `/search`)
- Retailer pricing, commission rates, or wallet phone numbers
- Claim details or identity matching results to the general public

### Theft prevention
The public `/verify/:id` endpoint is the anti-theft mechanism. It must always:
1. Return `status` (registered / stolen / transferred) so a buyer can check before purchase
2. Return `retailerName` for POS products (proof of legitimate sale channel)
3. Return enough item description to confirm physical identity, but not enough to enable impersonation

### Enumeration protection
Auto-increment `id` columns are never exposed in public routes — only `uniqueIdentifier` and `serialNumber`. This prevents:
- Scraping all registered items by incrementing IDs
- Estimating total item count from the highest visible ID
- Correlating a user's items across different reports

---

## Roadmap: Future Improvements

These are not blockers for launch but improve the system long-term:

1. ✅ **Prefix KZR display labels by entity type** — SHIPPED
   - `KZR-000001` for L&F items
   - `POS-000001` for POS products
   - Avoids ambiguity in support tickets when both IDs have the same number

2. **Validate `uniqueIdentifier` format by category**
   - Phones: must look like IMEI (15 digits)
   - Documents: NIN / passport format
   - Vehicles: VIN format
   - This prevents garbage identifiers and improves match quality

3. ✅ **Add a `kizere_id` column to `pos_products`** — SHIPPED
   - A KIZERE-generated UUID (not retailer-supplied) that serves as an immutable internal reference
   - Keeps `serialNumber` as the merchant-facing key but adds an independent trust anchor
   - Useful if a retailer ever needs to update/correct a serial number without breaking ownership history

4. **Rate-limit the public `/verify/` endpoint**
   - Prevent bulk scraping via sequential serial number guessing
   - Implement: 30 requests/minute per IP with a 429 response and `Retry-After` header

5. **Audit log for public verify lookups**
   - Record IP, timestamp, and queried identifier for stolen item lookups
   - Enables law enforcement data requests without exposing the log publicly

---

## Developer Quick Reference

```
Need to link to a public item page?    → /verify/:item.uniqueIdentifier
Need to link to a public POS product?  → /verify/:posProduct.serialNumber
Need to show a user-friendly ref?      → KZR-${String(id).padStart(6, '0')}
Need to query the DB by external ID?   → WHERE unique_identifier = ? (items)
                                         WHERE serial_number = ? (pos_products)
Need to query the DB by internal ref?  → WHERE id = ? (admin only)
Never put in a public URL:             → items.id, pos_products.id, users.id
Never store in the DB:                 → KZR-XXXXXX display labels
```
