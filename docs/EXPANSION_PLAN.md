# Expansion Plan — Controlled Multi-Category & Multi-Country

**Purpose**: Roll out new scopes in strict order to avoid operational overload  
**Phase 7**: Safe sequencing for expansion beyond MN × USED_CAR_PRIVATE pilot

---

## Objective

Expand beyond the MN × USED_CAR_PRIVATE pilot **without increasing system risk**.

**Core Principle**: This phase is **pure expansion**, not innovation.
- No new logic
- No new states
- No new actions
- No new settlement rules

Everything achieved via:
- Template parameterization
- Feature flag scope extension
- Ops readiness scaling

---

## Expansion Targets

1. **MN × USED_CAR_DEALER** (Step 1)
2. **MN × REAL_ESTATE_SALE** (Step 2)
3. **KR × USED_CAR_PRIVATE** (Step 3)

---

## Expansion Order (STRICT)

### ⚠️ Critical Rule: Do NOT run steps in parallel

Each step must be:
- Stable for ≥ 7 days before next step
- Validated with limited volume (5-10 deals)
- Monitored for issues
- Documented in expansion log

---

## Step 1: MN × USED_CAR_DEALER

### Prerequisites

- [ ] MN × USED_CAR_PRIVATE stable for ≥ 7 days
- [ ] No critical incidents in last 7 days
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%

### Per-Step Checklist

- [ ] **Enable feature flag** for MN × USED_CAR_DEALER
  - Update `pilot.country-allowlist`: `["MN"]`
  - Update `pilot.category-allowlist`: `["USED_CAR_PRIVATE", "USED_CAR_DEALER"]`
  - Verify backend validation allows both categories

- [ ] **Confirm template exists and validated**
  - Template file: `MN_USED_CAR_DEALER_v1.json`
  - Parameters validated:
    - `inspectionTtlDays`: 3
    - `disputeTtlHours`: 48
    - `holdbackRatio`: 0.15
    - `immediateRatio`: 0.85
    - `evidenceRequired`: true
    - `offsetCapsByReasonCode`: validated

- [ ] **Run seed rehearsal**
  - Create test deal in demo profile
  - Verify full lifecycle (CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED)
  - Verify timers visible
  - Verify money summary correct
  - Verify evidence upload works

- [ ] **Train operator on category differences**
  - Dealer vs Private: What's different?
  - Evidence expectations (dealer may have inspection reports)
  - Typical dispute patterns
  - Resolution time targets

- [ ] **Go-live with limited volume**
  - Target: 5-10 deals
  - Monitor for 72 hours
  - Check for issues daily
  - Document any problems

### Success Criteria

- [ ] 5-10 deals created successfully
- [ ] All deals reach SETTLED state
- [ ] No critical incidents
- [ ] Operator can handle both categories
- [ ] Stable for ≥ 7 days

### Timeline

- **Day 0**: Enable flag, seed rehearsal, operator training
- **Days 1-3**: Limited volume (5-10 deals), monitor closely
- **Days 4-7**: Continue monitoring, validate stability
- **Day 7+**: Consider Step 2 if stable

---

## Step 2: MN × REAL_ESTATE_SALE

### Prerequisites

- [ ] MN × USED_CAR_DEALER stable for ≥ 7 days
- [ ] No critical incidents in last 7 days
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%
- [ ] Operator comfortable with 2 categories

### Per-Step Checklist

- [ ] **Enable feature flag** for MN × REAL_ESTATE_SALE
  - Update `pilot.category-allowlist`: `["USED_CAR_PRIVATE", "USED_CAR_DEALER", "REAL_ESTATE_SALE"]`
  - Verify backend validation allows all three categories

- [ ] **Confirm template exists and validated**
  - Template file: `MN_REAL_ESTATE_SALE_v1.json`
  - Parameters validated:
    - `inspectionTtlDays`: 7 (longer than used car)
    - `disputeTtlHours`: 72
    - `holdbackRatio`: 0.25 (higher than used car)
    - `immediateRatio`: 0.75
    - `evidenceRequired`: true
    - `offsetCapsByReasonCode`: validated

- [ ] **Run seed rehearsal**
  - Create test deal in demo profile
  - Verify full lifecycle
  - Verify timers visible (7-day inspection TTL)
  - Verify money summary correct (25% holdback)
  - Verify evidence upload works (contract PDF, photos)

- [ ] **Train operator on category differences**
  - Real Estate vs Used Car: What's different?
  - Longer inspection period (7 days vs 3 days)
  - Higher holdback (25% vs 15%)
  - Evidence types (contract PDF, property photos)
  - Typical dispute patterns (document mismatch, damage)
  - Resolution time targets

- [ ] **Go-live with limited volume**
  - Target: 5-10 deals
  - Monitor for 72 hours
  - Check for issues daily
  - Document any problems

### Success Criteria

- [ ] 5-10 deals created successfully
- [ ] All deals reach SETTLED state
- [ ] No critical incidents
- [ ] Operator can handle all 3 categories
- [ ] Stable for ≥ 7 days

### Timeline

- **Day 0**: Enable flag, seed rehearsal, operator training
- **Days 1-3**: Limited volume (5-10 deals), monitor closely
- **Days 4-7**: Continue monitoring, validate stability
- **Day 7+**: Consider Step 3 if stable

---

## Step 3: KR × USED_CAR_PRIVATE

### Prerequisites

- [ ] MN × REAL_ESTATE_SALE stable for ≥ 7 days
- [ ] No critical incidents in last 7 days
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%
- [ ] Operator comfortable with 3 categories
- [ ] KR pre-check completed (see `/docs/KR_PRECHECK.md`)

### Per-Step Checklist

- [ ] **Enable feature flag** for KR × USED_CAR_PRIVATE
  - Update `pilot.country-allowlist`: `["MN", "KR"]`
  - Update `pilot.category-allowlist`: `["USED_CAR_PRIVATE"]` (start with one category)
  - Verify backend validation allows KR country

- [ ] **Confirm template exists and validated**
  - Template file: `KR_USED_CAR_PRIVATE_v1.json`
  - Parameters validated:
    - `inspectionTtlDays`: 3
    - `disputeTtlHours`: 48
    - `holdbackRatio`: 0.15
    - `immediateRatio`: 0.85
    - `evidenceRequired`: true
    - `offsetCapsByReasonCode`: validated

- [ ] **Run seed rehearsal**
  - Create test deal in demo profile
  - Verify full lifecycle
  - Verify timers visible
  - Verify money summary correct
  - Verify evidence upload works
  - Verify Korean language display (if applicable)

- [ ] **Train operator on country differences**
  - KR vs MN: What's different?
  - Language: Korean (ko) fully reviewed
  - Currency: KRW formatting
  - Evidence types: Photos sufficient
  - Dispute TTL: Reviewed for user expectation
  - Cultural considerations (if any)

- [ ] **Go-live with limited volume**
  - Target: 5-10 deals
  - Monitor for 72 hours
  - Check for issues daily
  - Document any problems

### Success Criteria

- [ ] 5-10 deals created successfully
- [ ] All deals reach SETTLED state
- [ ] No critical incidents
- [ ] Operator can handle KR country
- [ ] Stable for ≥ 7 days

### Timeline

- **Day 0**: Enable flag, seed rehearsal, operator training, KR pre-check
- **Days 1-3**: Limited volume (5-10 deals), monitor closely
- **Days 4-7**: Continue monitoring, validate stability
- **Day 7+**: Consider further expansion if stable

---

## Expansion Log Template

```markdown
## Expansion Entry — [Date] — [Country] × [Category]

**Step**: [1/2/3]
**Status**: [IN_PROGRESS/COMPLETE/ROLLED_BACK]

**Actions Taken**:
- [Action 1]
- [Action 2]

**Metrics** (after 7 days):
- Deals created: X
- Settlement completion rate: Y%
- Dispute rate: Z%
- Critical incidents: N

**Issues Encountered**:
- [Issue 1]
- [Issue 2]

**Resolution**:
- [Resolution 1]
- [Resolution 2]

**Next Step**: [Proceed to next step / Hold / Rollback]
```

---

## Rollback Plan

### If Step Fails

**Step 1: Disable Feature Flag**
```yaml
pilot:
  country-allowlist: [previous countries]
  category-allowlist: [previous categories]
```

**Step 2: Let Existing Deals Complete**
- Do not cancel active deals
- Let timers expire naturally
- Process disputes normally

**Step 3: Document Failure**
- Log in expansion log
- Identify root cause
- Fix issues before retry

**Step 4: Retry After Fix**
- Wait ≥ 7 days after fix
- Re-run per-step checklist
- Start with limited volume again

---

## Acceptance Criteria

### Previous Step Stable

- [ ] Previous step stable for ≥ 7 days
- [ ] No critical incidents in last 7 days
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%

### Current Step Validated

- [ ] Feature flag enabled
- [ ] Template exists and validated
- [ ] Seed rehearsal successful
- [ ] Operator trained
- [ ] Limited volume deployed (5-10 deals)
- [ ] 72-hour monitoring completed

---

## Next Steps

1. **Template Readiness**: See `/docs/TEMPLATE_READINESS.md`
2. **Ops Scaling Plan**: See `/docs/OPS_SCALING_PLAN.md`
3. **KR Pre-check**: See `/docs/KR_PRECHECK.md`
4. **Go-Live Runbook**: See `/docs/GO_LIVE_RUNBOOK.md`
