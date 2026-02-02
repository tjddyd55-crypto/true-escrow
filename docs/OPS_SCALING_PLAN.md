# Ops Scaling Plan

**Purpose**: Prepare ops to handle higher volume and more categories  
**Phase 7**: Scaling operations for multi-category & multi-country expansion

---

## Objective

Scale operations to support:
- Multiple categories (USED_CAR_PRIVATE, USED_CAR_DEALER, REAL_ESTATE_SALE)
- Multiple countries (MN, KR)
- Higher deal volume
- More complex dispute patterns

**Key Principle**: Changes allowed only in:
- Dashboard filters (UI only)
- Additional operator staffing (human process)
- SLA adjustments (human process only)
- Ops playbook updates (documentation)

**Forbidden**: Core logic changes, new states, new actions

---

## Changes Allowed

### 1. Dashboard Filters Expanded

**Current**: Filter by country, category, state

**Expanded Filters**:
- Country: MN, KR (multi-select)
- Category: USED_CAR_PRIVATE, USED_CAR_DEALER, REAL_ESTATE_SALE (multi-select)
- State: All states (unchanged)
- Reason code: All reason codes (for disputes)
- Date range: Start/end date (unchanged)

**Implementation**:
- Update dashboard UI filters
- Backend queries support multi-select
- No core logic changes

---

### 2. Additional Operator Staffing

**Current**: 1 operator (pilot)

**Scaling**:
- **2-3 categories**: 1-2 operators
- **3+ categories**: 2-3 operators
- **Multi-country**: Consider timezone coverage

**Responsibilities**:
- Primary operator: All categories, all countries
- Secondary operator: Backup, peak hours
- Escalation: On-call engineer

**Training**:
- Category-specific differences
- Country-specific considerations
- Dispute patterns per category
- Resolution time targets

---

### 3. SLA Adjustments (Human Process Only)

**Current SLA** (Pilot):
- Dispute resolution: Within TTL (48-72 hours)
- Response time: < 1 hour during business hours

**Scaled SLA**:
- **Dispute resolution**: Within TTL (unchanged, system-enforced)
- **Response time**: < 2 hours during business hours (if volume increases)
- **Escalation**: < 30 minutes for SEV0/SEV1

**Note**: SLA adjustments are operational, not system changes

---

## Ops Playbook Updates

### Category-Specific Evidence Expectations

#### USED_CAR_PRIVATE

**Expected Evidence**:
- Vehicle exterior photos (required)
- Interior photos (required)
- Odometer photo (required)
- Inspection report (optional)
- Registration document (optional)

**Typical Issues**:
- Missing photos
- Odometer mismatch
- Damage not disclosed

**Operator Action**:
- Verify all required photos present
- Check odometer reading matches description
- Review damage photos if issue raised

---

#### USED_CAR_DEALER

**Expected Evidence**:
- Vehicle exterior photos (required)
- Interior photos (required)
- Odometer photo (required)
- Inspection report (often provided by dealer)
- Warranty document (if applicable)

**Typical Issues**:
- Inspection report discrepancies
- Warranty terms unclear
- Missing accessories

**Operator Action**:
- Review inspection report carefully
- Verify warranty terms if applicable
- Check for missing promised accessories

---

#### REAL_ESTATE_SALE

**Expected Evidence**:
- Contract document (PDF, required)
- Property photos (required)
- Inspection report (optional)
- Title/ownership documents (if required by country)

**Typical Issues**:
- Document mismatch (address, price, terms)
- Property condition not matching description
- Missing promised fixtures

**Operator Action**:
- Verify contract details match deal
- Review property photos for condition
- Check for missing fixtures if issue raised

---

### Typical Dispute Patterns Per Category

#### USED_CAR_PRIVATE

**Most Common Reason Codes**:
1. `DAMAGE_MINOR` (60-70%)
2. `MISSING_PARTS` (20-30%)
3. `DOCUMENT_MISMATCH` (10-20%)

**Resolution Pattern**:
- Minor damage: OFFSET from holdback (10-15% cap)
- Missing parts: OFFSET or partial refund
- Document mismatch: Full or partial refund

---

#### USED_CAR_DEALER

**Most Common Reason Codes**:
1. `DAMAGE_MINOR` (40-50%)
2. `QUALITY_NOT_MATCHING` (30-40%)
3. `MISSING_PARTS` (10-20%)

**Resolution Pattern**:
- Minor damage: OFFSET from holdback
- Quality issues: Partial refund (higher cap)
- Missing parts: OFFSET or replacement

---

#### REAL_ESTATE_SALE

**Most Common Reason Codes**:
1. `DOCUMENT_MISMATCH` (50-60%)
2. `DAMAGE_MINOR` (20-30%)
3. `MISSING_PARTS` (10-20%)

**Resolution Pattern**:
- Document mismatch: Full or partial refund (high value)
- Minor damage: OFFSET from holdback (higher cap: 10-15%)
- Missing fixtures: OFFSET or replacement

---

### Resolution Time Targets

**By Category**:

| Category | Typical Resolution Time | Target |
|----------|------------------------|--------|
| USED_CAR_PRIVATE | 24-48 hours | < 48 hours |
| USED_CAR_DEALER | 24-48 hours | < 48 hours |
| REAL_ESTATE_SALE | 48-72 hours | < 72 hours |

**Factors**:
- Real estate: Higher value, more complex, longer TTL
- Used car: Lower value, simpler, shorter TTL

**Operator Action**:
- Prioritize by TTL urgency (not category)
- Real estate may need more time for review
- Used car disputes typically faster to resolve

---

## Dashboard Enhancements

### Multi-Category View

**New Dashboard Page**: "Category Comparison"

**Metrics**:
- Deals by category (pie chart)
- Dispute rate by category (bar chart)
- Average time to settle by category
- Top reason codes by category

**Filters**:
- Country (multi-select)
- Category (multi-select)
- Date range

---

### Category-Specific Filters

**Dispute Dashboard**:
- Filter by category
- Show category in dispute list
- Sort by category + TTL

**Settlement Dashboard**:
- Filter by category
- Compare settlement rates by category
- Identify category-specific issues

---

## Operator Training

### Category Differences

**Training Topics**:
1. **Evidence Expectations**
   - What evidence is required per category
   - How to verify evidence completeness
   - Category-specific evidence types

2. **Dispute Patterns**
   - Most common reason codes per category
   - Typical resolution patterns
   - Category-specific considerations

3. **Resolution Time Targets**
   - Different targets per category
   - When to escalate
   - How to prioritize

4. **Country Differences** (when KR added)
   - Language considerations
   - Currency formatting
   - Cultural expectations

---

## Acceptance Criteria

### Ops Can Answer: "Which category is causing the most disputes?"

**Dashboard Should Show**:
1. Dispute count by category
2. Dispute rate by category (%)
3. Top reason codes by category
4. Average resolution time by category

**Operator Should Know**:
1. Which category has highest dispute rate
2. Why (common reason codes)
3. How to address (resolution patterns)

---

## Scaling Metrics

### Volume Targets

| Phase | Categories | Countries | Target Volume | Operators |
|-------|-----------|-----------|---------------|-----------|
| Pilot | 1 | 1 | 10-30 deals | 1 |
| Step 1 | 2 | 1 | 20-50 deals | 1-2 |
| Step 2 | 3 | 1 | 30-70 deals | 2 |
| Step 3 | 3 | 2 | 50-100 deals | 2-3 |

### Performance Targets

- **Settlement completion rate**: > 90% (all categories)
- **Dispute rate**: < 10% (all categories)
- **Average time to settle**: < 7 days (all categories)
- **Admin intervention rate**: < 50% (operator resolves vs TTL default)

---

## Rollback Plan

### If Scaling Fails

**Step 1**: Reduce scope
- Disable newest category/country
- Let existing deals complete
- Revert to previous stable state

**Step 2**: Analyze issues
- Identify root cause
- Determine if ops process or system issue
- Fix ops process (preferred) or system (if needed)

**Step 3**: Retry after fix
- Wait ≥ 7 days
- Re-train operators
- Re-enable with limited volume

---

## Next Steps

1. **Expansion Plan**: See `/docs/EXPANSION_PLAN.md`
2. **Template Readiness**: See `/docs/TEMPLATE_READINESS.md`
3. **Go-Live Runbook**: See `/docs/GO_LIVE_RUNBOOK.md`
