# Demo Script — 10-Minute Partner Demo

**Purpose**: Repeatable demo script that proves core value of Trust & Escrow platform  
**Duration**: 10 minutes  
**Audience**: Partners, investors, potential customers

---

## Demo Preconditions

### Technical Setup
- Application reachable (localhost:3000 for frontend, localhost:8080 for backend)
- At least 2 test users per role (or role switching available)
- Templates exist for categories:
  - `REAL_ESTATE_SALE`
  - `USED_CAR_PRIVATE`

### User Accounts
- **Buyer**: `demo-buyer-1` (UUID: `00000000-0000-0000-0000-000000000001`)
- **Seller**: `demo-seller-1` (UUID: `00000000-0000-0000-0000-000000000002`)
- **Operator/Admin**: `demo-admin-1` (UUID: `00000000-0000-0000-0000-000000000003`)

### Seeded Deals
Run seed script first (see `/docs/DEMO_SEED_GUIDE.md`):
- Used Car Happy Path Deal (ID: `demo-uc-happy-1`)
- Used Car Issue Deal (ID: `demo-uc-issue-1`)
- Real Estate Doc Mismatch Deal (ID: `demo-re-doc-1`)

---

## Demo Script

### Part A — Used Car Happy Path (3 minutes)

**Objective**: Show complete lifecycle with auto-approve timer

#### Step 1: Open Deal List
- Navigate to `/deals/demo-uc-happy-1`
- **Show**: Deal in `INSPECTION` state
- **Point out**:
  - Canonical state: `INSPECTION` (English, never translated)
  - Localized label: "검수 중" (Korean) or "Under Inspection" (English)
  - Category: `USED_CAR_PRIVATE`

#### Step 2: Money Summary
- **Show**: Money Summary panel
- **Point out**:
  - Total: $10,000
  - Immediate (85%): $8,500 — "Released to seller at DELIVERED"
  - Holdback (15%): $1,500 — "Will be released at APPROVED"
- **Emphasize**: No manual settlement buttons visible

#### Step 3: Timeline View
- **Show**: Timeline component
- **Point out**:
  - State progression: `CREATED` → `FUNDED` → `DELIVERED` → `INSPECTION`
  - Ledger entries: `HOLD` entries for both immediate and holdback
  - Evidence metadata: Vehicle photos uploaded at DELIVERED

#### Step 4: Auto-Approve Timer
- **Show**: `AUTO_APPROVE` timer visible in Timeline
- **Point out**:
  - Timer type: `AUTO_APPROVE` (canonical key, English)
  - Countdown: "2 days 14 hours remaining"
  - Explanation: "If buyer does not respond, deal will auto-approve"
- **Emphasize**: Timer is **never hidden** (non-negotiable)

#### Step 5: Auto-Transition (Simulate)
- **Option A**: Wait for timer to expire (not practical in demo)
- **Option B**: Manually trigger auto-approve via admin (for demo only)
- **Show**: State transitions to `APPROVED` → `SETTLED`
- **Point out**:
  - Ledger shows `RELEASE` entry for holdback
  - Timeline shows audit event: "Auto-approve timer elapsed"
  - Money Summary shows all amounts finalized

**Key Message**: Rule-based settlement, transparent ledger, no hidden timers

---

### Part B — Used Car Issue → OFFSET (3 minutes)

**Objective**: Show ISSUE overlay with evidence requirement and constrained resolution

#### Step 1: Open Issue Deal
- Navigate to `/deals/demo-uc-issue-1`
- **Show**: Deal in `ISSUE` state (overlay, not replacement flow)
- **Point out**: Timeline still shows main flow; ISSUE is overlay

#### Step 2: Issue Details
- **Show**: Issue raised with `DAMAGE_MINOR` reason code
- **Point out**:
  - Reason code: `DAMAGE_MINOR` (canonical, English)
  - Localized label: "경미한 손상" (Korean) or "Minor Damage" (English)
  - Evidence: Photo of scratch uploaded

#### Step 3: Dispute TTL Timer
- **Show**: `DISPUTE_TTL` timer visible
- **Point out**:
  - Timer type: `DISPUTE_TTL` (canonical key)
  - Countdown: "11 days 6 hours remaining"
  - Explanation: "If TTL expires, default resolution will be applied"

#### Step 4: Resolution (Admin View)
- Switch to admin view: `/admin/disputes`
- **Show**: Dispute in list, sorted by TTL (most urgent first)
- Navigate to `/admin/disputes/{dispute-id}/resolve`
- **Point out**:
  - Resolution dropdown: **Only rule-allowed outcomes** (no free-form input)
  - Options: `releaseHoldbackMinusMinorCap`, `fullRefund`, `partialRefund`, `releaseHoldback`
  - **Emphasize**: Admin **cannot** type arbitrary outcomes (constraint enforced)

#### Step 5: Resolve with OFFSET
- Select: `releaseHoldbackMinusMinorCap`
- Enter audit reason: "Minor scratch confirmed, applying offset cap per template"
- **Show**: Resolution applied
- **Point out**:
  - Ledger shows `OFFSET` entry (e.g., $150 = 10% of holdback)
  - Ledger shows `RELEASE` entry for remaining holdback ($1,350)
  - Timeline shows resolution event with audit reason
  - Deal transitions to `SETTLED`

**Key Message**: Constrained admin ops, evidence required, append-only ledger

---

### Part C — Real Estate Doc Mismatch (4 minutes)

**Objective**: Show document mismatch issue with admin constrained resolution

#### Step 1: Open Real Estate Deal
- Navigate to `/deals/demo-re-doc-1`
- **Show**: Deal in `ISSUE` state
- **Point out**: Category: `REAL_ESTATE_SALE`

#### Step 2: Issue Details
- **Show**: Issue raised with `DOCUMENT_MISMATCH` reason code
- **Point out**:
  - Evidence: Contract PDF uploaded
  - Free text: "Contract shows different property address than agreed"
  - Evidence requirement enforced (cannot submit without evidence)

#### Step 3: Admin Resolution
- Switch to admin view: `/admin/disputes`
- Navigate to resolve page
- **Show**: Full timeline with all events
- **Point out**:
  - Evidence metadata visible (read-only)
  - Timeline reconstruction from audit events + ledger entries

#### Step 4: Constrained Resolution
- **Show**: Resolution dropdown (constrained, no free-form)
- Select: `partialRefund`
- Enter audit reason: "Document mismatch confirmed, partial refund per template policy"
- **Show**: Confirmation modal
- **Point out**:
  - Modal shows selected outcome
  - Modal shows audit reason
  - Warning: "This action will be logged as an audit event"

#### Step 5: Final State
- **Show**: Deal transitions to `SETTLED`
- **Point out**:
  - Ledger shows `REFUND` entry
  - Timeline shows resolution event with audit reason
  - All audit events visible in chronological order

**Key Message**: Admin constrained resolution, audit trail, evidence-based disputes

---

## Demo Closing Points

### Core Value Propositions
1. **Rule-Based Settlement**: No manual intervention, automated state transitions
2. **Transparent Ledger**: Append-only, immutable, fully auditable
3. **No Hidden Timers**: All timers always visible, never hidden
4. **Constrained Admin Ops**: Admin cannot choose arbitrary outcomes
5. **Category Support**: Real estate + used car (extensible via templates)

### Non-Negotiables (Emphasize)
- ❌ No pause button
- ❌ No manual settlement for buyers/sellers
- ❌ Admin cannot type arbitrary outcomes
- ✅ All timers always visible
- ✅ Evidence required for issues (unless template waives)
- ✅ Canonical keys remain English (i18n for labels only)

### Next Steps
- Partner onboarding: See `/docs/PARTNER_ONBOARDING.md`
- API integration: See `/docs/API_CONSUMER_FLOW.md`
- Country templates: See `/docs/COUNTRY_TEMPLATE_MATRIX.md`

---

## Troubleshooting

### Timer Not Visible
- Check deal state: Timer should be visible in `INSPECTION` (AUTO_APPROVE) or `ISSUE` (DISPUTE_TTL)
- Verify template has timer enabled: Check template JSON

### Illegal Actions Appearing
- Verify user role matches contract: Buyer/Seller/Operator
- Check deal state: Actions should match FRONTEND_INTEGRATION_CONTRACT.md

### Ledger Not Showing
- Verify deal has been funded: Ledger entries start at FUNDED
- Check timeline: Ledger entries appear in timeline reconstruction

### Evidence Upload Fails
- Verify evidence requirement: Check template `evidenceRequired` flag
- Check file size/type: Should accept image/video/PDF
