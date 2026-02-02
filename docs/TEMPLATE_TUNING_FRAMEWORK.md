# Template Tuning Framework

**Purpose**: Make template tuning safe, measurable, and reversible (parameters only)  
**Phase 6**: v1 → v2 workflow with audit trail

---

## Objective

Enable template parameter adjustments based on pilot feedback and metrics without changing core code.

**Key Principles**:
- Templates are immutable once published (v1 stays forever)
- New version = new file/key (v2, v3, etc.)
- New deals pick latest; existing deals remain pinned
- All changes must be parameter-only (no core logic changes)

---

## Tuning Inputs

### 1. Pilot Feedback Form

**Source**: `/docs/PILOT_FEEDBACK_FORM.md`

**Key Questions**:
- Is inspection TTL too short/long?
- Is dispute TTL too short/long?
- Is holdback ratio too high/low?
- Are offset caps appropriate?

**Process**:
1. Collect feedback from buyers, sellers, operators
2. Aggregate common themes
3. Identify parameter concerns
4. Document in tuning log

---

### 2. Metrics from Dashboard

**Source**: `/docs/OPS_DASHBOARD_SPEC.md`

**Key Metrics**:
- Average time to settle
- Dispute rate
- Admin intervention rate
- Timer SLA compliance
- Evidence completeness rate

**Process**:
1. Review metrics daily
2. Identify trends
3. Compare against targets
4. Document in tuning log

---

### 3. Top 3 Reason Codes

**Source**: Disputes dashboard

**Process**:
1. Identify most frequent reason codes
2. Check if offset caps are appropriate
3. Adjust if needed

**Example**:
- If `DAMAGE_MINOR` is 80% of disputes but offset cap is too low
- Consider increasing offset cap for `DAMAGE_MINOR`

---

### 4. Evidence Completeness Rate

**Source**: Evidence completeness dashboard

**Process**:
1. Check % of issues with evidence
2. If < 100% and template requires evidence, investigate
3. Consider adjusting `evidenceRequired` flag (rare)

---

### 5. Time-to-Settle Distribution

**Source**: Settlement health dashboard

**Process**:
1. Review time-to-settle histogram
2. If too many deals > 7 days, investigate
3. Consider adjusting inspection TTL or dispute TTL

---

## Allowed Parameters to Tune

### 1. inspectionTtlDays

**Purpose**: Auto-approve timer duration

**Current (v1)**: 3 days

**Adjustment Triggers**:
- Too many auto-approvals causing buyer complaints → increase
- Too many deals stuck in INSPECTION → decrease (rare)

**Example**:
```json
{
  "inspectionTtlDays": 4  // Increased from 3
}
```

---

### 2. disputeTtlHours

**Purpose**: Dispute resolution TTL

**Current (v1)**: 48 hours

**Adjustment Triggers**:
- Too many disputes expiring without resolution → increase
- Too many disputes taking too long → decrease (rare)

**Example**:
```json
{
  "disputeTtlHours": 72  // Increased from 48
}
```

---

### 3. holdbackRatio / immediateRatio

**Purpose**: Money split between immediate and holdback

**Current (v1)**: 15% holdback, 85% immediate

**Constraint**: `holdbackRatio + immediateRatio = 1.0`

**Adjustment Triggers**:
- Too many disputes but holdback too low → increase holdback
- Sellers complaining about delayed payment → decrease holdback (rare)

**Example**:
```json
{
  "holdbackRatio": 0.20,  // Increased from 0.15
  "immediateRatio": 0.80  // Decreased from 0.85
}
```

---

### 4. offsetCapsByReasonCode

**Purpose**: Maximum offset percentage by reason code

**Current (v1)**:
```json
{
  "offsetCapsByReasonCode": {
    "DAMAGE_MINOR": 0.1,
    "MISSING_PARTS": 0.1
  }
}
```

**Adjustment Triggers**:
- Too many disputes for minor issues → adjust caps
- Buyers complaining about insufficient offset → increase caps
- Sellers complaining about excessive offset → decrease caps

**Example**:
```json
{
  "offsetCapsByReasonCode": {
    "DAMAGE_MINOR": 0.15,  // Increased from 0.1
    "MISSING_PARTS": 0.15  // Increased from 0.1
  }
}
```

---

### 5. evidenceRequired

**Purpose**: Whether evidence is mandatory for issue creation

**Current (v1)**: `true` (default)

**Adjustment Triggers**:
- Rare: If evidence requirement is causing issues
- Typically kept as `true`

**Example**:
```json
{
  "evidenceRequired": true  // Usually unchanged
}
```

---

## Versioning Rules (Hard)

### Immutability

**Rule**: Templates are immutable once published

**Implications**:
- v1 template cannot be modified
- v1 deals remain pinned to v1
- New version required for any changes

---

### New Version Creation

**Process**:
1. Copy existing template file
2. Create new file with incremented version: `MN_USED_CAR_PRIVATE_v2.json`
3. Update parameters
4. Deploy new template
5. Update feature flag: `pilot.template-version: v2`

**Example**:
```bash
# Copy v1 to v2
cp templates/country/MN_USED_CAR_PRIVATE_v1.json \
   templates/country/MN_USED_CAR_PRIVATE_v2.json

# Edit v2 parameters
# Update application-pilot.yml: template-version: v2
```

---

### Deal Version Pinning

**Rule**: New deals pick latest; existing deals remain pinned

**Implementation**:
- Deal creation: Use `pilot.template-version` for new deals
- Existing deals: Keep `templateVersion` field in ContractInstance (immutable)

**Example**:
- Deal created with v1 → always uses v1 (even if v2 exists)
- Deal created with v2 → always uses v2

---

## Decision Triggers (Examples)

### Trigger 1: Too Many Auto-Approvals

**Symptom**: Buyers complaining "I didn't have enough time to inspect"

**Metrics**:
- High auto-approve rate (> 50%)
- Negative feedback about timer duration

**Action**:
- Increase `inspectionTtlDays` from 3 to 4 or 5
- Create v2 template
- Document in tuning log

---

### Trigger 2: Too Many Disputes for Minor Issues

**Symptom**: High dispute rate for `DAMAGE_MINOR`

**Metrics**:
- `DAMAGE_MINOR` is 60%+ of disputes
- Buyers complaining offset is too low

**Action**:
- Increase `offsetCapsByReasonCode.DAMAGE_MINOR` from 0.1 to 0.15
- Create v2 template
- Document in tuning log

---

### Trigger 3: Too Many Stalled Disputes

**Symptom**: Disputes expiring without resolution

**Metrics**:
- High TTL expiry rate (> 20%)
- Admin intervention rate < 50%

**Action**:
- Increase `disputeTtlHours` from 48 to 72
- OR: Improve admin staffing/process
- Create v2 template (if TTL adjustment)
- Document in tuning log

---

## Required Artifacts

### 1. Template Tuning Log

**File**: `/docs/TEMPLATE_TUNING_LOG.md`

**Format**: Append-only log with entries:

```markdown
## 2026-02-15 — v1 → v2

**Reason**: Too many auto-approvals causing buyer complaints

**Metrics**:
- Auto-approve rate: 65%
- Negative feedback: 8/10 buyers said timer too short

**Changes**:
- `inspectionTtlDays`: 3 → 4 days
- `disputeTtlHours`: 48 → 72 hours

**Expected Effect**: 
- Reduce auto-approve rate to < 40%
- Increase buyer satisfaction

**Actual Impact** (to be filled after v2 deployment):
- TBD
```

**Process**:
1. Before creating v2: Document reason, metrics, changes, expected effect
2. After v2 deployment: Update with actual impact

---

### 2. Template File

**File**: `/templates/country/MN_USED_CAR_PRIVATE_v2.json`

**Content**: Updated parameters

**Example**:
```json
{
  "country": "MN",
  "category": "USED_CAR_PRIVATE",
  "version": "v2",
  "params": {
    "inspectionTtlDays": 4,
    "disputeTtlHours": 72,
    "autoApproveEnabled": true,
    "holdbackRatio": 0.15,
    "immediateRatio": 0.85,
    "evidenceRequired": true,
    "offsetCapsByReasonCode": {
      "DAMAGE_MINOR": 0.1,
      "MISSING_PARTS": 0.1
    }
  }
}
```

---

## Tuning Workflow

### Step 1: Collect Inputs

1. Review pilot feedback forms
2. Review metrics dashboard
3. Identify top 3 reason codes
4. Check evidence completeness
5. Review time-to-settle distribution

---

### Step 2: Analyze

1. Identify parameter concerns
2. Determine if tuning needed
3. If yes, proceed to Step 3
4. If no, document rationale

---

### Step 3: Create v2 Template

1. Copy v1 template to v2
2. Update parameters
3. Validate: `holdbackRatio + immediateRatio = 1.0`
4. Save new template file

---

### Step 4: Document in Tuning Log

1. Create entry in `/docs/TEMPLATE_TUNING_LOG.md`
2. Document:
   - Reason (metric/feedback)
   - Old value → new value
   - Expected effect
   - Date/time

---

### Step 5: Deploy v2

1. Update feature flag: `pilot.template-version: v2`
2. Restart application (or use dynamic config)
3. Verify new deals use v2
4. Verify existing deals remain on v1

---

### Step 6: Monitor Impact

1. Track metrics after v2 deployment
2. Compare v1 vs v2 performance
3. Update tuning log with actual impact
4. Adjust further if needed (create v3)

---

## Acceptance Criteria

### Every Tuning Change Has:

- [ ] **Reason**: Documented metric or feedback
- [ ] **Old Value → New Value**: Clear before/after
- [ ] **Expected Effect**: What we expect to happen
- [ ] **Date/Time**: When change was made
- [ ] **Actual Impact**: Updated after deployment (if available)

---

## Rollback Plan

### If v2 Template Has Issues

**Step 1**: Revert template version
```yaml
pilot:
  template-version: v1
```

**Step 2**: New deals use v1 again

**Step 3**: Document rollback in tuning log

**Note**: Do NOT delete v2 template; keep for audit and future reuse

---

## Next Steps

1. **Template Tuning Log**: See `/docs/TEMPLATE_TUNING_LOG.md`
2. **Pilot Launch Plan**: See `/docs/PILOT_LAUNCH_PLAN.md`
3. **Ops Dashboard**: See `/docs/OPS_DASHBOARD_SPEC.md`
