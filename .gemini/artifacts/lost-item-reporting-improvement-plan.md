# Lost Item Reporting Feature: Testing & Improvement Plan

**Generated:** 2026-02-03  
**Based on:** `docs/use_cases.md` & Current Implementation Analysis  
**Focus:** Logic, Security, Production Readiness

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [User Perspective Test Scenarios](#user-perspective-test-scenarios)
4. [Security Audit & Improvements](#security-audit--improvements)
5. [Logic Improvements](#logic-improvements)
6. [Production Readiness Checklist](#production-readiness-checklist)
7. [Implementation Tasks](#implementation-tasks)

---

## Executive Summary

This plan addresses all use cases from `docs/use_cases.md` with a focus on:
- **The Distressed Owner** (Lost Item Angle) - Use Cases 1.1, 1.2, 1.3
- **The Good Samaritan** (Found Item Angle) - Use Cases 2.1, 2.2
- **The System Guardian** (Administrator Angle) - Use Cases 3.1, 3.2, 3.3
- **The Official Verifier** (Agent/Moderator Angle) - Use Cases 4.1, 4.2

---

## Current Implementation Analysis

### ✅ What's Already Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Report Creation (Lost/Found) | ✅ Complete | Zod validation, receipt generation |
| Report Matching Engine | ✅ Basic | Uses title keywords, location, unique identifier |
| Claim Filing System | ✅ Complete | 50-char min proof, image upload |
| Email Notifications | ✅ Complete | Report confirmation, match alerts |
| Content Moderation Reports | ✅ Complete | Spam, scam, fraud flagging |
| Input Sanitization | ✅ Complete | XSS protection, HTML sanitization |
| Rate Limiting | ✅ Complete | Auth: 10/15min, API: 100/5min |

### ⚠️ Gaps Identified

| Gap | Severity | Impact |
|-----|----------|--------|
| No duplicate claim prevention | High | Users can spam claims on same report |
| Missing authorization on report fetch | Medium | Users can view any report by ID |
| No expiration enforcement | High | Old reports never auto-expire |
| Finder can't add notes before verification | Medium | Communication gap |
| No dispute resolution workflow | Medium | Two claimants can't be compared |
| Missing audit trail for claims | High | No history of claim status changes |
| No image validation | Medium | Malicious files could be uploaded |

---

## User Perspective Test Scenarios

### 🔍 Use Case 1.1: Standard Search (The Distressed Owner)

**User Story:** *"I lost my wallet at Kigali Mall. I want to search for matching found reports."*

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T1.1.1 | Search by category "Wallets" + location "Kigali" | Returns found wallet reports in Kigali area | High |
| T1.1.2 | Sort results by "Newest" | Most recent reports appear first | High |
| T1.1.3 | Search with misspelled location "kigal" | Fuzzy match still returns Kigali results | Medium |
| T1.1.4 | No results found scenario | Shows helpful message with option to file report | High |
| T1.1.5 | Search with special characters | No SQL injection, sanitized input | Critical |

**Improvements Needed:**
1. **Add fuzzy search** - Use PostgreSQL `pg_trgm` for typo tolerance
2. **Add location radius search** - Allow "within 5km of Kigali Mall"
3. **Show relevant search suggestions** - "Did you mean...?"

---

### 📝 Use Case 1.2: Filing a Lost Report

**User Story:** *"I can't find my wallet. I want to file a Lost report."*

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T1.2.1 | Submit report with all required fields | Report created with LST-XXXXX receipt | High |
| T1.2.2 | Submit without description (< 10 chars) | Validation error shown | High |
| T1.2.3 | Upload 5 images (exceeds limit) | Error for non-premium users | High |
| T1.2.4 | Submit with unique identifier (IMEI) | Triggers match against registered items | High |
| T1.2.5 | Submit while not logged in | Redirect to login, preserve form data | Medium |
| T1.2.6 | Submit with XSS in description | Content sanitized, report created safely | Critical |
| T1.2.7 | Receive confirmation email | Email sent with receipt number | High |
| T1.2.8 | Background matching triggers | Notification if matching Found report exists | High |

**Improvements Needed:**
1. **Add form auto-save** - Draft reports should persist in localStorage
2. **Add location autocomplete** - Use Google Places or OpenStreetMap
3. **Add date validation** - Can't report item lost "in the future"
4. **Add pre-submission match check** - Show existing matches before filing

---

### ✋ Use Case 1.3: Claiming an Item

**User Story:** *"I found a matching Found report for my wallet. I want to claim it."*

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T1.3.1 | File claim with valid proof (50+ chars) | Claim created, finder notified | High |
| T1.3.2 | File claim with invalid proof (< 50 chars) | Validation error shown | High |
| T1.3.3 | Upload evidence images | Images attached to claim | High |
| T1.3.4 | Claim own found report | Error: Can't claim your own report | Critical |
| T1.3.5 | Claim a Lost report | Error: Can only claim Found items | High |
| T1.3.6 | Claim same report twice | Error: Duplicate claim prevented | High |
| T1.3.7 | Finder receives notification | In-app + email notification | High |

**Improvements Needed:**
1. **Prevent duplicate claims** - One user, one claim per report
2. **Add claim countdown/expiry** - Auto-reject if finder doesn't respond in X days
3. **Add communication channel** - Secure messaging between claimant and finder

---

### 🙋 Use Case 2.1: Reporting a Found Item (Good Samaritan)

**User Story:** *"I found a phone in my taxi. I want to report it so the owner can find it."*

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T2.1.1 | File Found report with details + photos | Report created with FND-XXXXX receipt | High |
| T2.1.2 | Include unique identifier (IMEI/Serial) | Matches against lost reports AND registered items | Critical |
| T2.1.3 | Background matching triggers | Owner of matching Lost report notified | High |
| T2.1.4 | Passive Protection match | Registered item owner notified | High |
| T2.1.5 | Premium visibility package purchased | Report ranks higher in search | Medium |

**Improvements Needed:**
1. **OCR for identifier extraction** - Auto-extract IMEI from photos (using Tesseract.js)
2. **Add reward/finder fee option** - Finder can indicate if they expect compensation
3. **Add item custody status** - "I have the item" vs "I saw it at location X"

---

### 📋 Use Case 2.2: Reviewing Claims (Good Samaritan)

**User Story:** *"Someone claimed the phone I found. I want to review their proof."*

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T2.2.1 | View all claims on my found items | List of claims with details shown | High |
| T2.2.2 | Verify a legitimate claim | Claim marked as verified, claimant notified | High |
| T2.2.3 | Reject an invalid claim | Claim marked as rejected, claimant notified | High |
| T2.2.4 | Add notes to claim | Notes saved, visible to Admin | High |
| T2.2.5 | Multiple claims on same item | Compare claims side-by-side | Medium |
| T2.2.6 | Verify claim updates report status | Report marked as "In_Progress" | High |

**Improvements Needed:**
1. **Claim comparison view** - Side-by-side UI for multiple claims
2. **Add verification checklist** - Guide finder through verification steps
3. **Escalation to Moderator** - Button to request official verification

---

### 🛡️ Use Case 3.1-3.3: System Guardian (Admin)

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T3.1.1 | Review KYC verification request | View documents, compare selfie, grant status | High |
| T3.2.1 | Review flagged fraudulent report | Suspend account, remove report | High |
| T3.2.2 | Bulk moderation actions | Process multiple flags efficiently | Medium |
| T3.3.1 | View resolution analytics | Dashboard shows recovery rates | High |
| T3.3.2 | Export reports to CSV | CSV download works | High |

**Improvements Needed:**
1. **Enhanced fraud detection** - Flag reports with suspicious patterns (same images, copy-paste descriptions)
2. **Admin action audit log** - Track all moderation decisions
3. **Suspicious activity alerts** - Auto-flag users with multiple rejected claims

---

### 🕵️ Use Case 4.1-4.2: Official Verifier (Moderator)

**Test Scenarios:**
| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| T4.1.1 | Verify high-value item claim | Compare serial numbers, mark verified | High |
| T4.2.1 | Two claimants for same item | View both claims, request additional proof | High |
| T4.2.2 | Resolve disputed claim | Make final decision, notify both parties | High |

**Improvements Needed:**
1. **Claim investigation panel** - View claimant history, past claims, verification status
2. **Request additional proof** - Send message requesting specific evidence
3. **Dispute timeline view** - Chronological view of all actions

---

## Security Audit & Improvements

### Critical Security Fixes

| Issue | Current State | Fix Required | Priority |
|-------|---------------|--------------|----------|
| **Authorization on GET /api/reports/:id** | Any authenticated user can view any report | Add ownership check or make reports public by design | Critical |
| **Duplicate claim prevention** | Not implemented | Add unique constraint (userId, reportId) | Critical |
| **Image file validation** | None beyond upload | Validate MIME type, file magic bytes, resize | High |
| **Rate limit on claims** | Uses general API limiter | Add specific claim rate limit (5 claims/hour) | High |
| **Report data exposure** | Contact info visible to all | Hide contact info until claim verified | High |

### Security Test Cases

```
SEC-001: SQL Injection in search
  Input: search='; DROP TABLE reports;--
  Expected: Query escaped, no SQL execution

SEC-002: XSS in report description
  Input: <script>alert('xss')</script>
  Expected: Content sanitized on save AND render

SEC-003: IDOR on report access
  Input: GET /api/reports/123 (not owned by user)
  Expected: 403 or report returned (if public by design)

SEC-004: Claim for non-existent report
  Input: POST /api/claims { reportId: 999999 }
  Expected: 404 Report not found

SEC-005: Claim on closed report
  Input: POST /api/claims { reportId: <closed-report-id> }
  Expected: 400 Cannot claim closed report

SEC-006: Image upload malicious file
  Input: Upload .exe renamed to .jpg
  Expected: File rejected, only valid images accepted

SEC-007: Brute force claim verification
  Input: PATCH /api/claims/1/verify repeatedly
  Expected: Rate limited after X attempts
```

---

## Logic Improvements

### 1. Enhanced Matching Algorithm

**Current State:** Simple keyword matching with location overlap

**Proposed Improvements:**
```typescript
// Enhanced score calculation
calculateMatchScore(r1: Report, r2: Report): number {
  let score = 0;
  
  // Critical: Unique Identifier (IMEI, Serial, etc.)
  if (r1.uniqueIdentifier && r2.uniqueIdentifier && 
      normalize(r1.uniqueIdentifier) === normalize(r2.uniqueIdentifier)) {
    score += 95; // Near-certain match
  }
  
  // High: Linked Item ID
  if (r1.itemId && r2.itemId && r1.itemId === r2.itemId) {
    score += 90;
  }
  
  // Medium: Same Category
  if (r1.category === r2.category) {
    score += 15;
  }
  
  // Medium: Location proximity (NEW)
  const distance = calculateDistance(r1.location, r2.location);
  if (distance < 1) score += 25;      // < 1km
  else if (distance < 5) score += 15;  // < 5km
  else if (distance < 10) score += 5;  // < 10km
  
  // Medium: Date proximity (NEW)
  const daysDiff = Math.abs(differenceInDays(r1.date, r2.date));
  if (daysDiff <= 1) score += 15;
  else if (daysDiff <= 7) score += 10;
  else if (daysDiff <= 30) score += 5;
  
  // Low-Medium: Title/Description keywords
  const commonKeywords = getCommonKeywords(r1.title, r2.title);
  score += Math.min(30, commonKeywords.length * 10);
  
  // NEW: Color matching (if specified in details)
  if (r1.details?.color && r2.details?.color &&
      r1.details.color.toLowerCase() === r2.details.color.toLowerCase()) {
    score += 10;
  }
  
  return Math.min(100, score);
}
```

### 2. Report Expiration Engine

**Current State:** `expirationDate` field exists but not enforced

**Proposed Implementation:**
```typescript
// Cron job: Run daily at 2 AM
async function processExpiredReports() {
  const now = new Date();
  
  // Find reports past expiration that aren't already closed
  const expiredReports = await db.select()
    .from(reports)
    .where(and(
      lt(reports.expirationDate, now),
      eq(reports.status, 'Open'),
      isNull(reports.gracePeriodEnd)
    ));
  
  for (const report of expiredReports) {
    // Start 7-day grace period
    await db.update(reports)
      .set({ 
        gracePeriodEnd: addDays(now, 7),
        status: 'In_Progress'
      })
      .where(eq(reports.id, report.id));
    
    // Notify user
    await sendExpirationWarningEmail(report);
  }
  
  // Auto-expire reports past grace period
  const expiredGracePeriod = await db.select()
    .from(reports)
    .where(and(
      lt(reports.gracePeriodEnd, now),
      ne(reports.status, 'Expired')
    ));
  
  for (const report of expiredGracePeriod) {
    await db.update(reports)
      .set({ status: 'Expired' })
      .where(eq(reports.id, report.id));
    
    await sendExpiredNotificationEmail(report);
  }
}
```

### 3. Claim Workflow State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐   │
│ Pending │───▶│ Reviewed │───▶│ Verified │───▶│ Resolved │   │
└─────────┘    └─────────┘    └──────────┘    └──────────┘   │
     │              │              │                          │
     │              │              └───────────────────────────┤
     │              │                                         │
     │              ▼                                         │
     │         ┌──────────┐                                   │
     └────────▶│ Rejected │───────────────────────────────────┘
               └──────────┘        (can appeal)
```

---

## Production Readiness Checklist

### ✅ Pre-Launch Checks

- [ ] **Load Testing:** Simulate 1000 concurrent report submissions
- [ ] **Database Indexes:** Ensure indexes on `reports.type`, `reports.status`, `reports.category`, `reports.location`
- [ ] **Error Monitoring:** Integrate Sentry/LogRocket for production error tracking
- [ ] **Backup Strategy:** Daily automated database backups
- [ ] **CDN for Images:** Cloudinary/S3 for report images with CDN
- [ ] **Email Deliverability:** SPF/DKIM/DMARC configured for production domain
- [ ] **Legal Compliance:** Terms of service, privacy policy, data handling consent
- [ ] **Accessibility:** WCAG 2.1 AA compliance for all forms

### Performance Optimizations

1. **Add database indexes:**
```sql
CREATE INDEX idx_reports_type_status ON reports(type, status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_location ON reports USING gin(to_tsvector('english', location));
CREATE INDEX idx_reports_unique_identifier ON reports(unique_identifier) WHERE unique_identifier IS NOT NULL;
CREATE INDEX idx_claims_report_id ON claims(report_id);
CREATE INDEX idx_claims_user_report ON claims(user_id, report_id);
```

2. **Add caching layer:**
- Cache popular search queries (Redis, 5-minute TTL)
- Cache report counts by status for dashboard

3. **Optimize matching job:**
- Run matching as background job (Bull/Agenda.js)
- Limit candidate scan to last 30 days of reports

---

## Implementation Tasks

### Phase 1: Security Hardening (Priority: CRITICAL)

| Task | Description | Estimate |
|------|-------------|----------|
| 1.1 | Add duplicate claim prevention (unique constraint) | 2h |
| 1.2 | Add authorization middleware for report access | 2h |
| 1.3 | Validate image files (MIME type + magic bytes) | 3h |
| 1.4 | Add claim-specific rate limiting | 1h |
| 1.5 | Hide contact info until claim verified | 2h |

### Phase 2: Logic Improvements (Priority: HIGH)

| Task | Description | Estimate |
|------|-------------|----------|
| 2.1 | Implement enhanced matching algorithm | 4h |
| 2.2 | Add report expiration cron job | 3h |
| 2.3 | Add claim workflow state machine | 4h |
| 2.4 | Prevent claiming closed/expired reports | 1h |
| 2.5 | Add claim appeal mechanism | 3h |

### Phase 3: UX Improvements (Priority: MEDIUM)

| Task | Description | Estimate |
|------|-------------|----------|
| 3.1 | Add fuzzy search with pg_trgm | 3h |
| 3.2 | Add location autocomplete | 4h |
| 3.3 | Add form auto-save (localStorage) | 2h |
| 3.4 | Add pre-submission match preview | 3h |
| 3.5 | Add claim comparison view for finders | 4h |

### Phase 4: Admin/Moderator Tools (Priority: MEDIUM)

| Task | Description | Estimate |
|------|-------------|----------|
| 4.1 | Add claim investigation panel | 4h |
| 4.2 | Add dispute timeline view | 3h |
| 4.3 | Add fraud detection alerts | 4h |
| 4.4 | Enhance moderation action logging | 2h |

### Phase 5: Production Hardening (Priority: HIGH)

| Task | Description | Estimate |
|------|-------------|----------|
| 5.1 | Add database indexes | 1h |
| 5.2 | Set up Redis caching | 3h |
| 5.3 | Configure background job queue | 4h |
| 5.4 | Add comprehensive logging | 2h |
| 5.5 | Configure error monitoring (Sentry) | 2h |

---

## Test Automation Strategy

### Unit Tests Needed

```
server/services/report-matching.test.ts (expand)
- Test calculateMatchScore with all factors
- Test location proximity scoring
- Test date proximity scoring
- Test edge cases (null values, empty strings)

server/routes/report.routes.test.ts (new)
- Test report creation with valid data
- Test validation failures
- Test authorization checks
- Test duplicate receipt prevention

server/routes/claim.routes.test.ts (new)
- Test claim creation
- Test duplicate claim prevention
- Test claim on wrong report type
- Test claim verification flow

server/storage/report.storage.test.ts (new)
- Test findPotentialMatches accuracy
- Test getReportsWithFilters with various params
- Test expiration logic
```

### E2E Tests Needed

```
client/e2e/lost-report-flow.spec.ts
- User logs in
- Searches for matching found reports
- Files a lost report
- Receives confirmation email
- Views report in dashboard

client/e2e/claim-flow.spec.ts
- Owner finds matching found report
- Files ownership claim
- Finder receives notification
- Finder reviews and verifies claim
- Both parties notified of resolution

client/e2e/admin-moderation.spec.ts
- Admin reviews flagged report
- Admin suspends fraudulent account
- Verify audit log entry created
```

---

## Summary

This plan provides a comprehensive roadmap to:
1. **Secure** the Lost Item Reporting feature against common vulnerabilities
2. **Enhance** the matching algorithm for better accuracy
3. **Complete** the claim workflow with proper state management
4. **Prepare** the system for production traffic and scale
5. **Automate** testing for ongoing reliability

**Total Estimated Effort:** 60-70 hours across all phases

**Recommended Order:**
1. Phase 1 (Security) - IMMEDIATE
2. Phase 5 (Production) - Before launch
3. Phase 2 (Logic) - Parallel with Phase 5
4. Phase 3 (UX) - Post-launch iteration
5. Phase 4 (Admin) - Post-launch iteration
