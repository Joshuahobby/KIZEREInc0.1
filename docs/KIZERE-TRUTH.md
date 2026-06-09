> *GetRwanda LTD | AI Automation Agency | Kigali, Rwanda*

---

# KIZERE — The Complete Truth

### The definitive source of record for what KIZERE is, what it does, why it exists, how it works, and where it is going.

> 🔵 **This document is the canonical reference.** Use it to onboard team members, brief investors, write pitch decks, prepare press materials, draft internal strategy papers, and make product decisions. When in doubt about what KIZERE is — read this first.

**Version:** 1.2 | **Last updated:** June 2026 | **Maintained by:** KIZERE INC.

---

## Table of Contents

1. [The One-Sentence Truth](#1-the-one-sentence-truth)
2. [What KIZERE Is Not](#2-what-kizere-is-not)
3. [The Problem](#3-the-problem)
4. [What KIZERE Is](#4-what-kizere-is)
5. [How It Works](#5-how-it-works)
6. [Who KIZERE Serves](#6-who-kizere-serves)
7. [The Full Product Suite](#7-the-full-product-suite)
8. [Business Model & Revenue](#8-business-model--revenue)
9. [Technology Architecture](#9-technology-architecture)
10. [The Infrastructure Thesis](#10-the-infrastructure-thesis)
11. [The Competitive Moat](#11-the-competitive-moat)
12. [Competitive Landscape](#12-competitive-landscape)
13. [Market Context](#13-market-context)
14. [Legal & Regulatory Standing](#14-legal--regulatory-standing)
15. [Data Protection & Privacy](#15-data-protection--privacy)
16. [The Founding Team](#16-the-founding-team)
17. [Traction & Milestones](#17-traction--milestones)
18. [The Raise](#18-the-raise)
19. [Current Status](#19-current-status)
20. [The Roadmap](#20-the-roadmap)
21. [Key Links & Contacts](#21-key-links--contacts)

---

## 1. The One-Sentence Truth

> **KIZERE is building the infrastructure for trusted global ownership — giving every physical item a verified digital identity so it can be registered, verified, protected, recovered, and transferred with absolute certainty.**

The tagline: **"The Identity of Things."**
The promise: **"Own It. Prove It. Protect It."**
The method: **"Register, verify, and protect what you own — instantly."**

---

## 2. What KIZERE Is Not

These misconceptions come up constantly. Clearing them early saves time.

| Misconception | The truth |
|---|---|
| **"It's a lost-and-found app"** | Lost & Found is Layer 1 — the entry point that builds the user base. The core product is an ownership registry and infrastructure platform. |
| **"It's a blockchain project"** | No blockchain. KIZERE uses a tamper-evident ownership ledger stored in a standard PostgreSQL database. Decentralisation is not the point — verifiability is. |

> **On the roadmap — blockchain anchoring:** KIZERE will periodically publish cryptographic hashes of its ownership ledger to a public blockchain. This enables any third party (telecom, insurer, court, regulator) to verify that KIZERE's records are untampered — without storing personal data on-chain. The operational database stays in PostgreSQL (fast, editable, fully compliant with Rwanda Law 058/2021's right to erasure). Blockchain anchoring adds institutional trust on top of that foundation. Target: post-Series A.
| **"It's a government database"** | KIZERE is a private platform that operates in compliance with Rwandan law. It is not run by or affiliated with any government agency, though government integration is a planned future partnership. |
| **"It only works for smartphones"** | Any physical object with any identifier — IMEI, serial number, VIN, passport number, or any owner-assigned tag — can be registered. A motorbike, a laptop, a camera, a document, a piece of equipment. |
| **"It requires internet at the point of verification"** | The public verify QR code displays a URL. Scanning the code requires only a camera. The lookup itself is a simple web request — it works on 2G. |
| **"It's a KYC/identity service"** | KIZERE verifies items, not people. KYC (identity verification) is an optional trust upgrade for users who want higher claim credibility — it is not the product. |

---

## 3. The Problem

### Physical ownership has no digital truth layer.

In Rwanda — and across East Africa and most of the developing world — when someone owns a phone, a laptop, a motorbike, or any valuable item, that ownership exists only in the physical world. There is no reliable, trusted, cross-platform record of who owns what.

The consequences are severe and daily:

- **Theft is frictionless.** A stolen phone can be resold the same day. There is no check a buyer can run before purchasing second-hand goods to confirm the item is not stolen.
- **Recovery is luck.** When an item is lost, there is no infrastructure connecting finders to owners. A good samaritan who finds a phone has no verified way to reach the rightful owner.
- **Ownership disputes are unresolvable.** Without a chain of title, two people claiming the same item have no neutral, authoritative record to settle the dispute.
- **Insurance and commerce are undermined.** Insurers cannot efficiently verify asset ownership at claim time. Marketplaces cannot guarantee provenance of second-hand goods.
- **Businesses have no provenance system.** Retailers who sell products have no standardised way to register ownership to customers, creating a permanent blind spot in their post-sale relationship.

**KIZERE is built to fix this — permanently.**

---

## 4. What KIZERE Is

KIZERE operates on three interlocking layers. Understanding all three is essential to understanding the company's full value.

### Layer 1 — Lost & Found Platform

The founding surface. Anyone can report a lost or found item. A matching engine connects finders with owners. Claims are filed, verified, and resolved. This layer solves the recovery problem — it is the visible, consumer-facing entry point that builds the user base and the network.

### Layer 2 — Item Registry & Theft Prevention

The ownership layer. Any item — a phone by its IMEI, a laptop by its serial number, a vehicle by its VIN, a document by its passport number — can be registered to a verified owner. Once registered, a public verification endpoint (`/verify/:id`) allows anyone to instantly check an item's status: **Registered, Stolen, or Transferred.** This is the anti-theft mechanism. A prospective buyer of a second-hand item can check in seconds whether they are being sold stolen property. The moment this registry reaches meaningful penetration in a market, buying stolen goods becomes structurally difficult.

### Layer 3 — Ownership Infrastructure

The platform layer. The registry, the verification endpoint, the ownership ledger, and the certificate issuance system are not just features inside a consumer app. They are protocol primitives — the building blocks that telecoms, insurers, e-commerce platforms, law enforcement, governments, and financial institutions can build on top of. This is where KIZERE's long-term value and valuation multiple live.

> 🔵 **The three layers are a flywheel.** More users on Layer 1 (Lost & Found) means more items registered on Layer 2 (Registry). More items registered on Layer 2 means more value for Layer 3 partners (Infrastructure). More Layer 3 partners querying the registry means more institutional trust, which drives more users to Layer 1. The flywheel is self-reinforcing.

---

## 5. How It Works

### For an individual

Four steps, all digital, all instant:

| Step | Action | What Happens |
|---|---|---|
| **1. Register** | Add any item in seconds | Item gets a unique digital identity, linked to the owner's verified account |
| **2. Verify** | Search any IMEI, serial, or KIZERE ID | Instantly see ownership status, flagged alerts, and provenance history |
| **3. Tag** | Generate a QR code or digital ID | Physical item gets a scannable link to its digital record |
| **4. Recover** | Report lost — or find a match | The platform connects finders and owners, then facilitates the return |

### For a retailer

1. Retailer scans a product at point of sale
2. Enters customer phone number or email
3. KIZERE backend creates or verifies the customer account
4. Product ownership is registered to that customer instantly
5. Customer receives a confirmation and a QR receipt
6. The full ownership chain is established before the customer leaves the store

**Performance target: under 500ms for the entire POS flow.**

---

## 6. Who KIZERE Serves

KIZERE is a multi-sided platform. Five distinct stakeholder types each derive different value.

### The Distressed Owner
The individual who has lost a valuable item and needs it back. They use KIZERE to search existing found reports, file a lost report, and file ownership claims against matching found items. They are the emotional core of KIZERE's story.

### The Good Samaritan
The individual who has found someone else's item. They report it on KIZERE to give the owner a chance to find it. They review and verify ownership claims. They are the supply side of the recovery network.

### The System Guardian (Administrator)
The KIZERE internal administrator. Manages identity verification (KYC), content moderation, dispute resolution, and platform analytics. Ensures platform integrity and user trust.

### The Official Verifier (Moderator)
A trusted intermediary for high-value or complex claims. Compares evidence, mediates disputes between multiple claimants, and makes binding verification decisions for contested items.

### The Business / Subscriber
Retailers, wholesalers, insurance companies, event organizers, NGOs, government agencies, and technology companies — any organization that deals with physical assets. They use the POS system to register products at point of sale, the batch upload for bulk items, and the admin dashboard for fleet and asset management.

> 🔵 **Platform note:** KIZERE is available in four languages — **English, French, Kinyarwanda, and Swahili** — reflecting Rwanda's multilingual reality and the platform's East African ambitions from day one.

---

## 7. The Full Product Suite

### 7.1 Lost & Found Reporting

- File a "Lost" or "Found" report with photos, description, unique identifier (IMEI, serial, VIN), and location
- System generates a unique receipt (`LST-XXXXX` for lost, `FND-XXXXX` for found)
- Background matching engine runs immediately against all existing reports
- Match notifications sent via in-app and email when a potential match is found
- Ownership claim system: claimant files proof (50+ character minimum, supporting images), finder reviews, moderator can arbitrate

### 7.2 Item Registry (Passive Protection)

- Register any item by its natural identifier (IMEI, serial, VIN, passport number, any tag)
- Registered items are flagged immediately if reported found or stolen
- Owner is notified the moment a registered item appears anywhere in the system
- Public `/verify/:id` endpoint — accessible to anyone, no account required — returns safe, minimal status data

### 7.3 Retailer POS System

- Barcode/QR scanner interface for point-of-sale environments
- Instant customer account creation from phone number alone
- Ownership ledger records every sale, transfer, and status change as a tamper-proof JSON chain
- Batch upload capability for high-volume environments (event organizers, warehouses, NGOs)
- Retailer dashboard for managing product inventory and ownership history

### 7.4 Consumer Verification Reports

- Any user can pay to access a full ownership and history report for any item
- Report includes: owner details, registration date, full provenance history, retailer origin (for POS items)
- One-time purchase or included with premium subscription
- Powered by: `GET /api/consumer/verify/:id/report` + PawaPay payment

### 7.5 KIZERE Premium Subscription

- Free tier: up to 3 item registrations
- Premium tier: unlimited registrations, free full verification reports, priority support
- Monthly mobile money payment via PawaPay
- Subscription status visible on user dashboard with expiry date

### 7.6 Ownership Certificates

- Official, digitally issued certificate proving item ownership
- Printable certificate card: item name, category, unique identifier, owner name, registration date, KIZERE logo and official seal
- Downloadable as PNG, printable directly from browser
- Admissible as supporting proof in insurance claims and dispute resolution
- One-time purchase per item

### 7.7 Ownership Transfer System

- Formal, paid transfer of item ownership from one verified KIZERE user to another
- Tamper-proof: transfer is recorded permanently in the ownership ledger
- Transfer fee ensures the system is not abused for casual reassignment
- Both parties receive confirmation; new owner's dashboard immediately reflects the item
- Critical for second-hand markets — buyer and seller both have verifiable proof of transfer

### 7.8 Two-Factor Authentication (2FA)

- Available on all KIZERE accounts
- OTP delivered via email or SMS (Pindo)
- Required for high-trust actions; adds a second verification layer on top of password or Google OAuth

### 7.9 Identity Verification (KYC)

- Users can upgrade to "Verified" status by submitting a government-issued National ID and a real-time selfie
- Biometric liveness check included
- Admin reviews and approves KYC submissions through a dedicated verification dashboard
- Verified users carry higher trust weight in claim disputes and ownership decisions

---

## 8. Business Model & Revenue

KIZERE operates a **multi-revenue-stream model** spanning individual consumers, businesses, and (future) enterprise API partners.

### Revenue Streams — Active

| Stream | Type | Mechanism |
|---|---|---|
| **Verification Reports** | Pay-per-use | Consumer pays per full ownership report |
| **Premium Subscriptions** | Recurring (monthly) | Unlimited registrations + free reports |
| **Ownership Certificates** | One-time | Official certificate per item |
| **Transfer Fees** | Transactional | Fee per formal ownership transfer |
| **Retailer Subscriptions** | B2B recurring | POS access + business dashboard |

### Payment Infrastructure

All payments are processed via **PawaPay** — the leading mobile money aggregator for sub-Saharan Africa, supporting MTN Mobile Money, Airtel Money, and other operators. No credit card required. This is by design: the addressable market in Rwanda and East Africa transacts primarily via mobile money.

### Revenue Streams — Planned (Infrastructure Layer)

| Stream | Type | Mechanism |
|---|---|---|
| **Enterprise API Access** | B2B subscription | Telecoms, insurers, e-commerce platforms querying the registry |
| **Embed Widget Licensing** | B2B | JavaScript verify badge embedded on third-party product pages |
| **Government / Law Enforcement Data Access** | Institutional | Structured access for stolen goods investigations |
| **Insurance API Integration** | B2B | Real-time ownership verification at claim time |

> 🔵 **Valuation note:** Consumer app companies trade at 3–5× revenue. Infrastructure companies (Stripe, Twilio, Plaid) trade at 10–20× because their revenue is structural — it flows from every transaction on top of them. KIZERE's roadmap deliberately targets the infrastructure multiple.

---

## 9. Technology Architecture

### Stack Overview

| Component | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui |
| **Backend** | Express.js (Node.js) |
| **Database** | PostgreSQL via **Neon** (serverless, auto-scaling) |
| **ORM** | Drizzle ORM |
| **Authentication** | Firebase Auth (Google OAuth) + Passport.js (local email/password) + custom session management |
| **2FA** | OTP via email (Resend) or SMS (Pindo) |
| **Payments** | PawaPay (mobile money aggregation) |
| **Email** | Resend |
| **SMS** | Pindo |
| **Real-time** | WebSocket (in-app push notifications) |
| **File Storage** | Cloudinary (private buckets for sensitive documents) |
| **Security** | Helmet, express-rate-limit, CSRF protection, Zod input validation, scrypt password hashing |
| **Internationalisation** | 4 locale files: `en.json`, `fr.json`, `rw.json`, `sw.json` |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Hosting** | Vercel |
| **CI/CD** | GitHub Actions (type-check → unit tests → E2E → build) · Vercel GitHub integration handles automatic deployment on merge |

### Environments

| Environment | URL | Purpose |
|---|---|---|
| Production | `kizere.rw` | Live, user-facing |
| Staging | `staging.kizere.rw` | Final QA and E2E testing before production promotion |

### Architecture Pattern

KIZERE follows a **service-oriented, layered architecture**:

```
Presentation Layer    →   React components and hooks
Service Layer         →   Business logic in typed service classes
Repository Layer      →   Data access via repository pattern
Infrastructure Layer  →   Database, storage, payments, logging, external APIs
```

This separation means each layer can be tested, swapped, or scaled independently.

### The Three ID Systems

KIZERE uses three distinct identifiers — understanding them is critical for anyone building on or with the platform.

**`items.uniqueIdentifier` — Lost & Found Item ID**
User-supplied at registration (IMEI, serial, VIN, passport number, any owner-assigned tag). Public-facing. Used in QR codes and the public verify URL. Not DB-enforced unique — intentional, as the same physical serial can appear in multiple reports.

**`pos_products.serialNumber` — POS Product ID**
Retailer-supplied at product registration. Globally unique (DB-enforced). The canonical provenance key for POS network items. Also resolves via the public verify endpoint.

**`KZR-XXXXXX` — Human Display Label**
Generated at render time from the auto-increment DB `id` using `String(id).padStart(6, '0')`. Never stored in the database. Never used as a lookup key. Purely cosmetic — for support tickets, receipts, and admin dashboards.

> 🔴 **Rule:** Auto-increment DB IDs (`items.id`, `pos_products.id`, `users.id`) are **never exposed in public URLs**. This prevents enumeration attacks — scraping all registered items by incrementing IDs, or estimating total item count from the highest visible ID.

### Security Architecture

- All sensitive identity documents (National IDs, selfies) stored in **private Cloudinary buckets**, accessible only via signed URLs
- Role-based access control (RBAC) enforced across all admin and moderator functions
- Two-factor authentication (2FA) via OTP delivered by email or SMS (Pindo) for sensitive account actions
- Rate limiting: authentication endpoints 10 requests/15 minutes; general API endpoints 300 requests/5 minutes; upload endpoints 20 requests/15 minutes
- XSS protection via `sanitize-html` and `xss-clean` on all user-submitted content
- Input validation via Zod schemas on all API routes
- Session management with `processingRestricted` flag enforced at data rights endpoints — users who invoke restriction rights are blocked from data retrieval through those pathways
- **Data at rest**: AES-256 encryption at the infrastructure level via Neon's serverless PostgreSQL (disk-level encryption). Sensitive documents (IDs, selfies) are additionally stored in private Cloudinary buckets accessible only via signed URLs.

---

## 10. The Infrastructure Thesis

### Why "infrastructure" is not marketing language — it is a structural fact.

**There can only be one registry.**

This is the deepest truth in KIZERE's business model. There can be many lost-and-found apps competing on UI and features. But there is only one definitive, trusted ownership registry for physical items in a jurisdiction. Once an insurer, a court, a telecom operator, or a government agency begins accepting KIZERE certificates as valid proof of ownership, all competing registries become irrelevant — because the one that institutional actors accept is the only one that matters.

**Network effects compound differently at the infrastructure layer.**

Every item registered today makes the platform more valuable for every future buyer, insurer, reseller, and law enforcement query. A registry where 5% of smartphones are registered is useful. One where 70% are registered is essential infrastructure no buyer or insurer can operate without. This is Metcalfe's Law applied to physical objects: the value of the network grows with the square of its registered items, not linearly.

**Revenue becomes structural, not earned.**

An app earns revenue by convincing individual users to pay. Infrastructure earns revenue because other businesses cannot function without it. When a telecom's stolen phone verification system queries KIZERE 10,000 times a day, KIZERE earns on every query — without marketing to a single end user. This is how valuation multiples shift from 3–5× to 10–20×.

**"The Identity of Things" is a deliberate strategic label.**

The Internet of Things gave every device a digital presence on a network. KIZERE gives every physical object a verifiable digital identity with a chain of custody, legal-weight ownership proof, and transfer history. The IoT required expensive hardware sensors. KIZERE requires only a serial number and a mobile phone — infrastructure that works on a Nokia feature phone in a rural market as easily as it works for a tech-forward urban consumer.

### The Infrastructure Stack (How KIZERE becomes a platform)

```
┌─────────────────────────────────────────────────────┐
│         Applications built on KIZERE                │
│  Insurance | Retail POS | Resale | Policing | Fintech│
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│           KIZERE — Identity of Things               │
│  Item Registry | Verify Engine | Transfer Ledger    │
│              | Certificate Issuance |               │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               Trust & Data Inputs                   │
│  National IDs | Retailer Network | Mobile Money     │
│                  | Secure Storage |                 │
└─────────────────────────────────────────────────────┘
```

---

## 11. The Competitive Moat

KIZERE's defensibility comes from five reinforcing sources:

### 11.1 The Data Moat
Every item registered, every ownership transfer recorded, every claim resolved — this data is the registry. It cannot be replicated by a competitor who launches tomorrow. A competitor starting today starts with zero items. KIZERE's registry is the moat, and it grows permanently with every registration.

### 11.2 The Network Effect Moat
The value of finding a lost item on KIZERE depends on how many items are registered. The value of checking a second-hand item depends on how many items are in the registry. Both scale with network size. A competitor with a smaller network is simply less useful — regardless of how good their UI is.

### 11.3 The Institutional Trust Moat
Once a government, insurer, or court accepts KIZERE certificates as valid proof, that institutional relationship is extremely sticky. These are not consumer relationships that can be switched with a better marketing campaign. They are structural dependencies built over years.

### 11.4 The Retailer Network Moat
Every retailer that integrates the POS system brings their entire product catalog and customer base into the KIZERE registry at the moment of sale. Switching costs for a retailer are high — their ownership history lives in KIZERE. This creates long-term retention without lock-in clauses.

### 11.5 The Regulatory Moat
KIZERE is built in full compliance with Rwanda Law No. 058/2021 (the national data protection law), registered with the NCSA (National Cyber Security Authority), and operating with a formally documented DPIA, ROPA, and incident response plan. A new entrant must replicate this compliance posture before operating legally. This is not a barrier KIZERE has — it is infrastructure KIZERE has already built.

---

## 12. Competitive Landscape

### No direct competitor exists in Rwanda or East Africa.

There is no platform operating in the region that combines lost-and-found reporting, an ownership registry, retailer POS integration, and mobile money payments in a single product. KIZERE is building this category, not competing in one.

### Global analogues — and why they don't translate

| Platform | What it does | Why it doesn't compete |
|---|---|---|
| **Immobilise** (UK) | Police-linked theft/recovery registry | UK-only, no mobile money, no POS integration, no East African language support, not built for mobile-first markets |
| **529 Garage** (North America) | Bike registration and recovery | Single category (bicycles only), North American market |
| **found.com** | Lost & found marketplace | No ownership registry layer, no anti-theft mechanism, consumer-only |
| **GSMA Stolen Phone Checker** | IMEI blacklist lookup | IMEI-only, no user registry, no recovery UX, no certificate issuance |
| **Police stolen goods databases** | Law enforcement records | Institutional access only, no public interface, no real-time, no user self-service |
| **Insurance company internal systems** | Internal asset records | Siloed per insurer, no cross-company registry, not accessible to individuals or third parties |

### KIZERE's structural advantages over all of the above

- **Mobile money payments** — no competitor in this space supports PawaPay / MTN Mobile Money / Airtel Money
- **4-language support** — English, French, Kinyarwanda, Swahili from day one
- **POS retailer integration** — ownership registered at point of sale, not after the fact
- **Infrastructure play** — KIZERE is designed to be queried by third parties; all others are closed systems
- **Rwanda regulatory compliance** — Law 058/2021 DPIA and ROPA are complete; competitors face a compliance build before they can legally operate here

---

## 13. Market Context

### Primary market: Rwanda

Rwanda is KIZERE's first market. Rwanda is among Africa's most digitally progressive economies: high mobile money penetration, a government committed to digital identity infrastructure, a growing middle class with rising rates of valuable asset ownership (smartphones, laptops, motorcycles), and a legal framework (Law 058/2021) that mandates proper data governance — creating a compliance advantage for early movers.

**The addressable problem in Rwanda alone:**
- Millions of smartphones, motorcycles, and laptops in circulation
- No centralised ownership registry
- A second-hand market with no provenance verification mechanism
- Insurance companies underwriting assets they cannot efficiently verify at claim time

### Expansion market: East Africa

KIZERE's four-language interface (English, French, Kinyarwanda, Swahili) is not an afterthought — it is a market signal. Swahili is the lingua franca of East Africa. From day one, KIZERE is designed to operate across Rwanda, Uganda, Kenya, Tanzania, and the DRC. The PawaPay payment infrastructure already supports mobile money operators across this region.

### The global thesis

Physical ownership verification is a problem on every continent. The infrastructure KIZERE builds in Rwanda — the registry protocol, the certificate standard, the ownership ledger format — is technology that can be licensed, franchised, or expanded into any market that lacks a trusted ownership layer. The goal is not to be Rwanda's lost-and-found app. The goal is to be the TCP/IP of physical ownership.

---

## 14. Legal & Regulatory Standing

### Governing law: Rwanda Law No. 058/2021

KIZERE operates under Rwanda's Law No. 058/2021 Relating to the Protection of Personal Data and Privacy. This law establishes:

- Lawful basis requirements for processing personal data (consent, contract performance, legitimate interest)
- Explicit consent requirements for sensitive data (biometrics, government IDs)
- Data subject rights: access, correction, deletion, restriction of processing, data portability
- Mandatory breach notification: NCSA within 48 hours; affected data subjects without undue delay if high risk

KIZERE maps every processing activity to a legal basis (documented in the ROPA) and has conducted a formal Data Protection Impact Assessment (DPIA) for its most sensitive processing activities (identity verification using government IDs and biometric selfies).

### Supervisory authority

The **National Cyber Security Authority (NCSA)** of Rwanda is KIZERE's supervisory authority. KIZERE maintains active registration with the NCSA. The DPO contact is `dpo@kizere.rw`.

### Regulatory documents maintained

| Document | Status |
|---|---|
| Data Protection Impact Assessment (DPIA) | Active |
| Record of Processing Activities (ROPA) | Active |
| Data Breach Incident Response Plan | Active |
| Annual Privacy Audit Checklist | Reviewed annually |
| Cookie Consent Implementation | Active |
| Privacy Policy (public-facing) | Active |

---

## 15. Data Protection & Privacy

### What data KIZERE collects

| Category | Data | Legal Basis |
|---|---|---|
| Account Registration | Name, email, phone, hashed password, role | Consent + Contract |
| Item Registration | Item descriptions, photos, location, user ID | Contract |
| Identity Verification (KYC) | Government ID (NID/Passport), selfie, biometric liveness code | Explicit Consent (Sensitive Data) |
| Data Export Requests | Full JSON dump of user's own data | Right of Access (Art. 19) |
| Cookie Storage | Session tokens, analytics identifiers | Consent (non-essential) |

### How KIZERE protects data

- **Sensitive documents** (National IDs, selfies): stored in **private Cloudinary buckets**. Accessible only via time-limited, signed URLs. Never publicly accessible.
- **Passwords**: hashed with **scrypt** — a memory-hard hashing algorithm. Never stored in plain text or reversibly.
- **Data in transit**: TLS encryption on all connections.
- **Data at rest**: AES-256 encryption at the infrastructure level via Neon's serverless PostgreSQL (disk-level encryption).
- **Access control**: Role-based access control (RBAC). Admins and moderators access only what their role requires.
- **Processing restrictions**: A `processingRestricted` flag is enforced at the data rights and consent endpoints. A user who has invoked their right to restrict processing is blocked from having their data returned through those pathways.
- **Soft-delete grace period**: Account deletions run a **7-day grace period** before permanent purge, preventing accidental permanent loss.
- **Database backups**: Automated via Neon serverless Postgres.

### Data subject rights (fully implemented)

- **Access**: Export My Data — delivers a full JSON dump of all personal data held
- **Deletion**: Account deletion with 7-day grace period
- **Restriction**: `processingRestricted` flag enforced at data rights endpoints
- **Portability**: JSON export on demand

---

## 16. The Founding Team

KIZERE is built by two founders with complementary skills across product, engineering, operations, and growth — both deeply rooted in Rwanda's tech ecosystem.

### Joshua Gasore — CEO & CTO | Founding Founder

Joshua leads product vision, technical architecture, and execution. As both CEO and CTO, he holds the full stack: the business strategy and the engineering decisions are unified in one person at this stage, which means KIZERE ships fast and without translation loss between vision and code. He is the architect of KIZERE's three-layer model, the infrastructure thesis, and the technical foundation the platform is built on.

### Elysée Nkundimana — COO & CMO | Co-Founder

Elysée leads operations, go-to-market, and brand. As both COO and CMO, she owns the execution engine: partnerships, retailer onboarding, growth strategy, and the market narrative. Her dual role reflects the reality of an early-stage company — the people who understand the business build the business. She is the operational counterpart to Joshua's technical foundation.

### Why this team

- **Founder-market fit**: Both founders are building for the market they live in. KIZERE is not a Western product being adapted for Africa — it is designed from the ground up for Rwanda's mobile-first, mobile-money economy.
- **Full-stack capability**: Between the two founders, KIZERE covers engineering, product, operations, marketing, partnerships, and regulatory compliance without external dependencies at this stage.
- **Speed**: A two-founder team with unified product and technical decision-making ships faster than organizations where strategy and engineering are separated. The current build is evidence of this.

---

## 17. Traction & Milestones

> 🔵 **KIZERE is launch-ready.** All payment infrastructure and all consumer-facing monetisation UIs are built, wired, and live. The platform is ready to accept revenue across all four streams. The numbers below reflect organic beta activity prior to the public launch.

### Platform activity (as of June 2026 — beta phase)

| Metric | Figure |
|---|---|
| Registered users | ~200 |
| Items registered in the registry | ~380 |
| Lost reports filed | ~110 |
| Found reports filed | ~70 |
| Successful recoveries facilitated | 14 |
| Retailer pilot partners (Kigali) | 2 |
| Active languages in use | 2 (en, rw) |
| Cities active | Kigali |

### Key milestones reached

| Milestone | Date |
|---|---|
| Full platform build complete (all 4 revenue backends live) | June 2026 |
| Rwanda Law 058/2021 compliance documentation complete | June 2026 |
| Retailer POS pilot — first partner onboarded | Q2 2026 |
| All monetisation UIs complete and wired (Phases 1–5) | June 2026 |
| Full i18n coverage across all 4 locales (en/fr/rw/sw) | June 2026 |
| E2E test suite operational (98 tests, 19 spec files) | June 2026 |
| KIZERE-TRUTH.md canonical reference document published | June 2026 |

### What the raise unlocks

The full platform — backend and all consumer-facing UIs — is complete and live. Every user who searches an item is now a potential verification report customer. Every free-tier user who hits 3 registrations is a premium subscription prospect. The raise does not fund the product — it funds market expansion, the developer API, and the first enterprise integrations.

---

## 18. The Raise

> 🔵 **KIZERE is raising a pre-seed round to fund the monetisation launch, team expansion, and market penetration in Rwanda ahead of East Africa expansion.**

### What we are raising

| | |
|---|---|
| **Round** | Pre-seed |
| **Amount** | USD 300,000 |
| **Structure** | [SAFE / Equity — to be confirmed with lead investor] |
| **Target close** | Q3 2026 |

### Use of funds

| Allocation | % | Purpose |
|---|---|---|
| **Product & Engineering** | 45% | Complete monetisation UI (Phases 1–4), developer API, embed widget |
| **Market Expansion** | 25% | Retailer network growth in Kigali, first moves into Uganda and Kenya |
| **Operations & Compliance** | 15% | Team growth, NCSA registration renewal, legal, audit |
| **Marketing & Brand** | 15% | Launch campaign, press, retailer acquisition |

### Milestones this raise funds

1. Public launch → first revenue within 30 days of close
2. 10 retailer partners onboarded in Kigali
3. 2,000 registered users by end of Q4 2026
4. Developer API published → first enterprise integration pilot
5. Uganda market entry initiated

### Why now

- The full platform is complete. Backend, all four monetisation UIs, i18n across four languages, and a 98-test E2E suite are all live. This raise funds market entry, not product development.
- The compliance infrastructure is complete. A competitor entering Rwanda today faces 6–12 months of regulatory work before they can legally operate. KIZERE has already done it.
- The registry has a head start. Every day of delay is a day the moat isn't being built. The raise accelerates the only thing that matters at this stage: items registered.

---

## 19. Current Status

> ✅ **Last verified: June 2026.** Platform is complete and launch-ready. Re-confirm this table before sharing with investors, press, or partners.

### What is built and live

| Component | Status |
|---|---|
| User authentication (Firebase + session) | ✅ Live |
| Item registration (Lost & Found) | ✅ Live |
| Item registry (Passive protection) | ✅ Live |
| Background matching engine | ✅ Live |
| Ownership claim system | ✅ Live |
| Email notification system (Resend) | ✅ Live |
| SMS notifications (Pindo) | ✅ Live |
| Two-factor authentication (OTP) | ✅ Live |
| Identity verification (KYC) | ✅ Live |
| Content moderation system | ✅ Live |
| Retailer POS system | ✅ Live |
| Admin dashboard | ✅ Live |
| Payment backend — all 4 revenue types | ✅ Live (PawaPay integrated) |
| Consumer verification report backend | ✅ Live |
| Consumer verification report UI (`/verify-item`) | ✅ Live |
| Premium subscription backend | ✅ Live |
| Premium subscription UI (`/premium`) | ✅ Live |
| Ownership certificate backend | ✅ Live |
| Ownership certificate UI (in item detail) | ✅ Live |
| Transfer fee backend | ✅ Live |
| Transfer ownership UI (in item detail) | ✅ Live |
| Admin revenue analytics dashboard | ✅ Live |
| 4-language i18n (en / fr / rw / sw) — full coverage | ✅ Live |
| Real-time WebSocket notifications | ✅ Live |
| E2E Playwright test suite (98 tests, 19 spec files) | ✅ Live |

### What is next (post-launch)

| Component | Status |
|---|---|
| Developer API + embed widget | 📅 Phase 8 — medium-term |
| Matching engine upgrades (fuzzy search, radius, OCR) | 📅 Medium-term |
| Blockchain ledger anchoring | 📅 Post-Series A |
| East Africa expansion (Uganda, Kenya, Tanzania) | 📅 Long-term |

> 🔵 **Revenue note:** All four revenue streams are live end-to-end — backend and frontend. Every user who searches an item can now pay for a full verification report. Free-tier users who hit the 3-registration cap are prompted to upgrade to Premium. Certificate purchase and ownership transfer are available on any registered item detail page.

---

## 20. The Roadmap

### Immediate focus (now — launch)

```
✅ Phase 1  →  Consumer verify pay-gate UI — SHIPPED
✅ Phase 2  →  Premium subscription UI + registration cap gate — SHIPPED
✅ Phase 3  →  Ownership certificate UI — SHIPPED
✅ Phase 4  →  Transfer ownership UI — SHIPPED
✅ Phase 5  →  Admin revenue analytics — SHIPPED
✅ Phase 6  →  i18n full coverage (en/fr/rw/sw) — SHIPPED
✅ Phase 7  →  E2E Playwright test suite (98 tests) — SHIPPED

→  Next: public launch + retailer outreach
```

### Medium-term (months 2–4)

- **Phase 8 — Infrastructure / Developer API**
  - Developer portal at `kizere.rw/developers`
  - Documented public API
  - API key issuance for enterprise integrations
  - JavaScript embed widget (one-line script, renders a KIZERE verify badge on any third-party site)
  - Enterprise pricing tier

- **Matching engine upgrades**
  - PostgreSQL `pg_trgm` fuzzy search for typo tolerance
  - Location radius search ("within 5km of Kigali Mall")
  - OCR-based identifier extraction from uploaded photos

- **Compliance hardening**
  - Rate-limit public `/verify/` endpoint (30 req/min per IP, 429 + `Retry-After`)
  - Audit log for public verify lookups (for law enforcement data requests)
  - Annual NCSA registration renewal check

### Long-term (months 5–12)

- East Africa regional expansion (Uganda, Kenya, Tanzania)
- B2B insurance API integration
- Telecom partnership program (MNOs querying registry at SIM swap / device registration)
- Government integration (stolen goods database cross-reference)
- `uniqueIdentifier` format validation by category (IMEI must be 15 digits, VIN format, etc.)

> ✅ **Already shipped:** `POS-XXXXXX` display prefix and `kizere_id` UUID anchor for POS products are both live in the current codebase.

---

## 21. Key Links & Contacts

| Resource | Link / Contact |
|---|---|
| **Platform** | `kizere.rw` |
| **Staging** | `staging.kizere.rw` |
| **GitHub** | `github.com/Joshuahobby/KIZEREInc0.1` |
| **Data Protection Officer** | `dpo@kizere.rw` |
| **Investor / Partnership enquiries** | `hello@kizere.rw` |
| **Press contact** | `press@kizere.rw` |
| **X (Twitter)** | `@KizereRW` *(confirm handle)* |
| **TikTok** | `@KizereRW` *(confirm handle)* |
| **LinkedIn** | *(add company page URL)* |
| **Legal jurisdiction** | Republic of Rwanda |
| **Supervisory authority** | National Cyber Security Authority (NCSA), Rwanda |

---

> 🔵 **Final word on what KIZERE is building:**
>
> Every physical object on earth eventually changes hands. It gets bought, sold, lost, stolen, insured, inherited, donated, or repossessed. Every one of those moments is a moment where trusted ownership data matters — to a buyer, a seller, an insurer, a court, a police officer, a customs officer, or a grieving family member.
>
> KIZERE is building the layer that makes trusted ownership data exist — for the first time, at scale, in a way that works on a feature phone in Musanze as well as on a smartphone in Kigali, London, or Nairobi.
>
> That is not a startup idea. That is infrastructure.

---

*— GetRwanda LTD*
