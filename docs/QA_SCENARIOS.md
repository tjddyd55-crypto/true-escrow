# QA Scenario Checks - Trust Escrow Platform

**Date**: 2026-02-01  
**Purpose**: End-to-end validation of 5 critical scenarios to confirm parity with Figma simulations and contract compliance.

---

## Prerequisites

### Test Data Seeding

Before running scenarios, seed test data:

1. **Create Test Deals**:
   ```bash
   # Use API or database to create test deals
   POST /api/deals
   {
     "buyerId": "test-buyer-1",
     "sellerId": "test-seller-1",
     "itemRef": "TEST-ITEM-001",
     "category": "CAR",
     "totalAmount": 1000.00,
     "currency": "USD"
   }
   ```

2. **Create Contract Templates** (if not already seeded):
   - At least one template per category (CAR, REAL_ESTATE_RENTAL, etc.)
   - Default immediatePercent: 70
   - Default holdbackPercent: 30

3. **Test Users**:
   - Buyer: `test-buyer-1`
   - Seller: `test-seller-1`
   - Admin: `test-admin-1` (OPERATOR role)

### Quick Deal Creation Script

```bash
# Create deal in CREATED state
curl -X POST http://localhost:8080/api/deals \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-buyer-1" \
  -d '{
    "buyerId": "test-buyer-1",
    "sellerId": "test-seller-1",
    "itemRef": "TEST-001",
    "category": "CAR",
    "totalAmount": 1000.00,
    "currency": "USD"
  }'

# Note the deal ID from response, then:
# Fund: POST /api/deals/{id}/fund
# Deliver: POST /api/deals/{id}/deliver
# etc.
```

---

## Scenario 1: Happy Path + Auto-Approve

### Objective
Verify complete deal flow from CREATED to SETTLED with auto-approve timer.

### Steps

1. **Create Deal** (CREATED state)
   - ✅ Deal created successfully
   - ✅ State: `CREATED`
   - ✅ Money Summary shows: Immediate (70%), Holdback (30%)
   - ✅ Actions: Buyer sees "Fund Deal" button
   - ✅ Seller sees no actions

2. **Fund Deal** (FUNDED state)
   - ✅ State transitions to `FUNDED`
   - ✅ Money Summary shows: "Will be released to seller at DELIVERED"
   - ✅ Actions: Seller sees "Mark Delivered" button
   - ✅ Buyer sees no actions

3. **Mark Delivered** (DELIVERED → INSPECTION)
   - ✅ State transitions to `DELIVERED` then `INSPECTION`
   - ✅ Immediate amount shows "Released to seller"
   - ✅ Actions: Buyer sees "Approve" and "Raise Issue" buttons
   - ✅ **Timer Check**: AUTO_APPROVE timer is visible
   - ✅ Timer shows countdown (e.g., "7 days remaining")
   - ✅ Timer explanation visible: "If buyer does not respond, deal will auto-approve"

4. **Wait for Auto-Approve** (or simulate timer expiry)
   - ✅ After timer expires, state transitions to `APPROVED`
   - ✅ HOLDBACK_RELEASE condition visible
   - ✅ Holdback shows "Will be released automatically"

5. **Holdback Release** (APPROVED → SETTLED)
   - ✅ State transitions to `SETTLED`
   - ✅ All amounts finalized
   - ✅ Ledger shows complete transaction history

### Validation Checklist

- [ ] Timeline shows correct state progression
- [ ] AUTO_APPROVE timer never hidden
- [ ] Money summary correct at each state
- [ ] Ledger entries match money flow
- [ ] No illegal actions exposed
- [ ] Timeline reconstruction works

---

## Scenario 2: ISSUE + Evidence + TTL Expiry Auto-Resolution

### Objective
Verify issue creation with evidence requirement and TTL auto-resolution.

### Steps

1. **Create and Fund Deal** (up to INSPECTION)
   - Follow steps 1-3 from Scenario 1

2. **Upload Evidence** (before raising issue)
   - ✅ Evidence Panel allows file upload
   - ✅ Evidence appears in evidence list
   - ✅ Evidence metadata stored correctly

3. **Raise Issue** (INSPECTION → ISSUE)
   - ✅ Navigate to "Raise Issue" form
   - ✅ Select reason code (e.g., `DAMAGE_MINOR`)
   - ✅ Select evidence (required)
   - ✅ **Validation**: Form blocks submit if no evidence selected
   - ✅ Submit issue
   - ✅ State transitions to `ISSUE`
   - ✅ **Timer Check**: DISPUTE_TTL timer is visible
   - ✅ Timer shows countdown
   - ✅ Timer explanation visible: "If TTL expires, default resolution will be applied"

4. **Verify Issue State**
   - ✅ ISSUE appears as overlay on timeline (not replacement)
   - ✅ Buyer can upload additional evidence
   - ✅ Admin can see dispute in dispute list
   - ✅ TTL visible in dispute list (sorted ascending)

5. **Wait for TTL Expiry** (or simulate)
   - ✅ After TTL expires, default resolution applied
   - ✅ State transitions to `SETTLED`
   - ✅ Ledger shows OFFSET entry (if applicable)
   - ✅ Timeline shows resolution event

### Validation Checklist

- [ ] Evidence required enforced (cannot submit without evidence)
- [ ] DISPUTE_TTL timer never hidden
- [ ] ISSUE is overlay, not replacement flow
- [ ] Default resolution applied correctly
- [ ] Ledger shows correct OFFSET/RELEASE entries
- [ ] Timeline shows all events chronologically

---

## Scenario 3: Admin Constrained Resolution

### Objective
Verify admin can only select rule-allowed outcomes, not free-form.

### Steps

1. **Create Issue** (follow Scenario 2 steps 1-3)

2. **Admin Views Dispute List**
   - ✅ Navigate to `/admin/disputes`
   - ✅ Dispute appears in list
   - ✅ TTL visible and sorted ascending
   - ✅ Severity displayed correctly

3. **Admin Opens Dispute Detail**
   - ✅ Navigate to resolve page
   - ✅ Full timeline visible
   - ✅ Evidence metadata visible (read-only)
   - ✅ **Constraint Check**: Resolution dropdown shows only allowed outcomes
   - ✅ **Constraint Check**: No free-form text input for resolution

4. **Admin Selects Resolution**
   - ✅ Select from dropdown (e.g., `releaseHoldbackMinusMinorCap`)
   - ✅ **Required**: Audit reason input field
   - ✅ Enter audit reason (required)
   - ✅ Click "Resolve"

5. **Confirmation Modal**
   - ✅ Modal shows selected outcome
   - ✅ Modal shows audit reason
   - ✅ Modal warns about audit logging
   - ✅ Confirm resolution

6. **Verify Resolution**
   - ✅ Dispute status changes to RESOLVED
   - ✅ Deal state transitions to SETTLED
   - ✅ Audit event created with reason
   - ✅ Ledger shows correct entries

### Validation Checklist

- [ ] Admin cannot type arbitrary outcomes (dropdown only)
- [ ] All admin actions require audit reason
- [ ] TTL always visible
- [ ] Resolution options limited to contract-defined outcomes
- [ ] Audit events logged correctly
- [ ] Ledger entries match resolution

---

## Scenario 4: Minor Issue OFFSET

### Objective
Verify OFFSET calculation and display for minor damage issues.

### Steps

1. **Create Issue with Minor Damage**
   - Follow Scenario 2, but select `DAMAGE_MINOR` reason code
   - Upload evidence
   - Raise issue

2. **Verify OFFSET Display**
   - ✅ Money Summary shows potential OFFSET amount
   - ✅ OFFSET separate from holdback
   - ✅ Reason code displayed (localized)

3. **Resolve with OFFSET** (Admin or TTL expiry)
   - ✅ Resolution applies OFFSET
   - ✅ Ledger shows OFFSET entry
   - ✅ OFFSET amount deducted from holdback
   - ✅ Remaining holdback released to seller

4. **Verify Final State**
   - ✅ Deal state: SETTLED
   - ✅ Ledger sum reconciles
   - ✅ Money Summary shows final amounts
   - ✅ Timeline shows OFFSET event

### Validation Checklist

- [ ] OFFSET displayed correctly
- [ ] OFFSET amount calculated per template policy
- [ ] Ledger shows OFFSET entry
- [ ] Money reconciliation correct
- [ ] Timeline shows OFFSET event

---

## Scenario 5: Action Guardrails by State/Role

### Objective
Verify UI never exposes illegal actions for state/role combinations.

### Test Matrix

| State | Role | Should See | Should NOT See |
|-------|------|------------|----------------|
| CREATED | BUYER | Fund Deal | Deliver, Approve, Raise Issue |
| CREATED | SELLER | (none) | All actions |
| FUNDED | BUYER | (none) | All actions |
| FUNDED | SELLER | Mark Delivered | Approve, Raise Issue, Fund |
| INSPECTION | BUYER | Approve, Raise Issue | Deliver, Fund |
| INSPECTION | SELLER | (none) | All actions |
| APPROVED | BUYER | (none) | All actions |
| APPROVED | SELLER | (none) | All actions |
| ISSUE | BUYER | Upload Evidence, View Timeline | Approve, Deliver |
| ISSUE | SELLER | (none) | All actions |
| ISSUE | OPERATOR | Resolve Dispute | Manual settle (free-form) |
| SETTLED | ALL | (none) | All actions |

### Steps

1. **For Each State/Role Combination**:
   - ✅ Navigate to deal in that state
   - ✅ Set user role (via UI or auth)
   - ✅ Verify only allowed actions visible
   - ✅ Verify forbidden actions NOT visible (not even disabled)
   - ✅ Verify action panel hidden when no actions available

2. **Try Illegal Actions** (if somehow exposed):
   - ✅ Frontend validation blocks before API call
   - ✅ Backend returns error (safety net)
   - ✅ Error displayed to user

### Validation Checklist

- [ ] No illegal actions exposed in UI
- [ ] Action visibility matches contract matrix
- [ ] Frontend validation before API calls
- [ ] Backend errors handled gracefully
- [ ] Role-based UI rendering correct

---

## General Validation Points

### Timer Visibility
- [ ] AUTO_APPROVE timer visible in INSPECTION state
- [ ] DISPUTE_TTL timer visible in ISSUE state
- [ ] HOLDBACK_RELEASE condition visible in APPROVED state
- [ ] Timers never hidden in collapsed sections
- [ ] Timers never hidden behind toggles

### Money Display
- [ ] Immediate amount (70%) displayed correctly
- [ ] Holdback amount (30%) displayed correctly
- [ ] Release conditions shown per state
- [ ] No "full freeze" implied (unless template allows)
- [ ] Ledger reconciliation correct

### i18n
- [ ] Canonical keys remain English in code
- [ ] UI labels localized correctly
- [ ] Locale switching works (ko ↔ en)
- [ ] No layout breakage on locale switch

### Non-Negotiables
- [ ] No pause button anywhere
- [ ] No manual settlement for buyers/sellers
- [ ] No hidden timers
- [ ] Evidence required for issue (unless template waives)
- [ ] Dispute TTL always visible

---

## Release Gate Criteria

All scenarios must pass without:
- ❌ Manual database edits
- ❌ Illegal actions exposed in UI
- ❌ Hidden timers
- ❌ Money display errors
- ❌ Timeline reconstruction failures
- ❌ Ledger idempotency violations

---

## Notes

- Run scenarios in order (1-5)
- Document any failures with screenshots/logs
- Verify against FRONTEND_INTEGRATION_CONTRACT.md
- Compare with Figma structural UI intent
