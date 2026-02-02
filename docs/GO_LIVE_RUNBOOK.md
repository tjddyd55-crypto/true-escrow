# Go-Live Runbook — Expansion

**Purpose**: Step-by-step guide for go-live of new (country × category) scopes  
**Phase 7**: Controlled expansion go-live procedures

---

## Objective

Safely launch new (country × category) combinations with:
- Minimal risk
- Full validation
- Quick rollback if needed

---

## Pre-Go-Live Checklist

### Prerequisites

- [ ] Previous step stable for ≥ 7 days
- [ ] No critical incidents in last 7 days
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%
- [ ] Template validated (see `/docs/TEMPLATE_READINESS.md`)
- [ ] Operator trained (see `/docs/OPS_SCALING_PLAN.md`)
- [ ] Country pre-check completed (if new country, see `/docs/KR_PRECHECK.md`)

---

## Go-Live Steps

### Step 1: Enable Feature Flag

**Action**: Update feature flag configuration

**For New Category (Same Country)**:
```yaml
pilot:
  enabled: true
  country-allowlist: ["MN"]  # Unchanged
  category-allowlist: ["USED_CAR_PRIVATE", "USED_CAR_DEALER"]  # Add new category
  template-version: v1
```

**For New Country**:
```yaml
pilot:
  enabled: true
  country-allowlist: ["MN", "KR"]  # Add new country
  category-allowlist: ["USED_CAR_PRIVATE"]  # Start with one category
  template-version: v1
```

**Validation**:
- [ ] Configuration file updated
- [ ] Application restarted (or config reloaded)
- [ ] Feature flag active
- [ ] Backend validation allows new scope

**Rollback**: Set flag to previous state, restart application

---

### Step 2: Seed 1-2 Internal Deals

**Action**: Create test deals in production environment

**Process**:
1. Create 1-2 test deals with new (country × category)
2. Use internal test accounts (buyer, seller)
3. Complete full lifecycle manually

**Validation**:
- [ ] Deal created successfully
- [ ] Template applied correctly
- [ ] Timers visible and correct
- [ ] Money summary correct
- [ ] Evidence upload works
- [ ] Full lifecycle completed (CREATED → SETTLED)

**If Issues**:
- Document issues
- Fix if possible (template/config only)
- Rollback if critical

**Rollback**: Delete test deals, disable feature flag

---

### Step 3: Verify Full Lifecycle

**Action**: Complete test deals through all states

**States to Verify**:
- [ ] **CREATED**: Deal created, money summary shows correct amounts
- [ ] **FUNDED**: Funds deposited, ledger shows HOLD entries
- [ ] **DELIVERED**: Delivery confirmed, immediate amount released
- [ ] **INSPECTION**: AUTO_APPROVE timer visible, countdown works
- [ ] **APPROVED**: Auto-approve or manual approve works
- [ ] **SETTLED**: Holdback released, ledger shows RELEASE entries

**Issue Flow** (Optional Test):
- [ ] **ISSUE**: Issue raised, DISPUTE_TTL timer visible
- [ ] **Resolution**: Admin resolves, constrained outcomes work
- [ ] **SETTLED**: Issue resolved, ledger shows OFFSET/REFUND entries

**Validation**:
- [ ] All state transitions work
- [ ] All timers visible and correct
- [ ] All ledger entries created correctly
- [ ] Timeline reconstructs correctly

**If Issues**:
- Document issues
- Fix if possible (template/config only)
- Rollback if critical

---

### Step 4: Open to Limited Users

**Action**: Enable for 5-10 real deals

**Process**:
1. Notify selected users (buyers, sellers)
2. Enable feature flag (already done in Step 1)
3. Monitor first deals closely
4. Collect feedback

**Target Volume**: 5-10 deals

**Monitoring**:
- [ ] Check deals created daily
- [ ] Verify no errors in logs
- [ ] Monitor dispute rate
- [ ] Collect user feedback

**Success Criteria**:
- [ ] 5-10 deals created
- [ ] No critical errors
- [ ] User feedback positive
- [ ] Operator can handle volume

**If Issues**:
- Document issues
- Fix if possible (template/config only)
- Rollback if critical (disable flag, let existing deals complete)

---

### Step 5: Monitor for 72 Hours

**Action**: Intensive monitoring for 3 days

**Daily Checks** (3 days):

**Day 1**:
- [ ] Morning: Check dispute list, verify timers
- [ ] Midday: Check new deals, verify evidence
- [ ] Evening: Export metrics, compile issues

**Day 2**:
- [ ] Morning: Check dispute list, verify timers
- [ ] Midday: Check new deals, verify evidence
- [ ] Evening: Export metrics, compile issues

**Day 3**:
- [ ] Morning: Check dispute list, verify timers
- [ ] Midday: Check new deals, verify evidence
- [ ] Evening: Export metrics, compile issues, prepare summary

**Metrics to Track**:
- Deals created: X
- Deals settled: Y
- Settlement completion rate: Z%
- Dispute rate: W%
- Critical incidents: N

**Success Criteria**:
- [ ] No critical incidents (SEV0/SEV1)
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%
- [ ] User feedback positive

**If Issues**:
- Document issues
- Fix if possible (template/config only)
- Rollback if critical

---

## Rollback Procedure

### If Go-Live Fails

**Step 1: Disable Feature Flag**
```yaml
pilot:
  enabled: true
  country-allowlist: [previous countries]  # Remove new country
  category-allowlist: [previous categories]  # Remove new category
  template-version: v1
```

**Step 2: Let Existing Deals Complete**
- Do not cancel active deals
- Let timers expire naturally
- Process disputes normally
- Complete all active deals

**Step 3: Document Failure**
- Log in expansion log
- Identify root cause
- Determine if fixable (template/config) or requires code change
- Plan fix or retry

**Step 4: Retry After Fix**
- Wait ≥ 7 days after fix
- Re-run go-live steps
- Start with limited volume again

---

## Post-Go-Live

### After 72 Hours

**If Successful**:
- [ ] Continue monitoring (less intensive)
- [ ] Gradually increase volume
- [ ] Collect feedback weekly
- [ ] Prepare for next expansion step

**If Issues**:
- [ ] Document issues
- [ ] Fix if possible (template/config only)
- [ ] Rollback if critical
- [ ] Retry after fix

---

## Go-Live Log Template

```markdown
## Go-Live Entry — [Date] — [Country] × [Category]

**Step**: [1/2/3]
**Status**: [IN_PROGRESS/COMPLETE/ROLLED_BACK]

**Actions Taken**:
- [ ] Feature flag enabled
- [ ] Seed deals created
- [ ] Full lifecycle verified
- [ ] Limited users enabled
- [ ] 72-hour monitoring completed

**Metrics** (after 72 hours):
- Deals created: X
- Deals settled: Y
- Settlement completion rate: Z%
- Dispute rate: W%
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

## Acceptance Criteria

### Go-Live Successful

- [ ] Feature flag enabled
- [ ] Seed deals successful
- [ ] Full lifecycle verified
- [ ] Limited users enabled (5-10 deals)
- [ ] 72-hour monitoring completed
- [ ] No critical incidents
- [ ] Settlement completion rate > 90%
- [ ] Dispute rate < 10%

---

## Next Steps

1. **Expansion Plan**: See `/docs/EXPANSION_PLAN.md`
2. **Template Readiness**: See `/docs/TEMPLATE_READINESS.md`
3. **Ops Scaling Plan**: See `/docs/OPS_SCALING_PLAN.md`
4. **KR Pre-check**: See `/docs/KR_PRECHECK.md` (if KR expansion)
