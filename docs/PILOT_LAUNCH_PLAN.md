# Pilot Launch Plan — MN × USED_CAR_PRIVATE

**Purpose**: Controlled 14-day pilot with clear roles, schedule, and daily operations  
**Scope**: Mongolia (MN) × Used Car Private (USED_CAR_PRIVATE)  
**Volume**: 10-30 deals  
**Duration**: 14 days

---

## Objective

Run a controlled pilot to:
- Validate template parameters (inspection TTL, dispute TTL, holdback ratio)
- Collect user feedback (buyers, sellers, operators)
- Measure key metrics (settlement rate, time to settle, dispute frequency)
- Make data-driven Go/No-Go decision for expansion

---

## Scope

### Included
- **Country**: MN (Mongolia)
- **Category**: USED_CAR_PRIVATE
- **Volume**: 10-30 deals
- **Template**: `MN_USED_CAR_PRIVATE_v1.json`

### Excluded
- New product features
- New DealStates/actions/timers
- Manual settlement
- Other countries/categories (until Go decision)

---

## Roles & Responsibilities

### Operator (Ops)
**Primary Responsibilities**:
- Monitor dispute list daily (TTL ascending)
- Resolve disputes with constrained outcomes only
- Verify timers are always visible
- Daily metrics report

**Daily Tasks**:
- Morning: Check dispute list, resolve urgent disputes
- Midday: Verify new deals entering INSPECTION have AUTO_APPROVE timer
- Evening: Export metrics, compile top 3 friction points

**Time Commitment**: 1-2 hours/day

---

### Pilot Coordinator
**Primary Responsibilities**:
- Recruit participants (buyers, sellers)
- Handle user support requests
- Collect feedback via `/docs/PILOT_FEEDBACK_FORM.md`
- Coordinate with operators and engineers

**Daily Tasks**:
- Respond to user questions
- Document common issues
- Schedule user interviews (if needed)
- Update feedback log

**Time Commitment**: 2-3 hours/day

---

### Engineer (On-Call)
**Primary Responsibilities**:
- Fix pilot-blocking bugs only
- No feature work during pilot
- Monitor system health
- Support rollback if needed

**On-Call Schedule**:
- Available during business hours (9 AM - 6 PM)
- Escalation path for critical issues

**Time Commitment**: As needed (typically < 1 hour/day)

---

### Analyst (Optional)
**Primary Responsibilities**:
- Aggregate metrics daily
- Analyze trends
- Prepare weekly summary reports
- Support Go/No-Go decision

**Daily Tasks**:
- Collect metrics from ops dashboard
- Calculate key indicators
- Identify patterns
- Document findings

**Time Commitment**: 1 hour/day

---

## 14-Day Schedule

### Day 0: Setup (Pre-Launch)

**Tasks**:
- [ ] Confirm template loaded: `MN_USED_CAR_PRIVATE_v1.json`
- [ ] Verify template parameters:
  - Inspection TTL: 3 days
  - Dispute TTL: 48 hours
  - Holdback: 15%
  - Immediate: 85%
- [ ] Enable pilot feature flag (see `/docs/FEATURE_FLAGS.md`)
- [ ] Prepare seed deals in demo profile for rehearsal
- [ ] Verify admin access control (OPERATOR role required)
- [ ] Test dispute resolution workflow
- [ ] Verify timer visibility in UI
- [ ] Set up ops dashboard (see `/docs/OPS_DASHBOARD_SPEC.md`)
- [ ] Prepare feedback collection forms

**Validation**:
- All seed deals visible in UI
- Timers visible for deals in INSPECTION
- Admin can access dispute list
- Admin can resolve disputes (constrained outcomes only)

---

### Days 1-2: Soft Launch

**Target**: 3-5 deals

**Focus Areas**:
- Timer clarity (AUTO_APPROVE visible in INSPECTION)
- Evidence upload process
- Dispute TTL behavior
- Money display clarity

**Daily Checks**:
- [ ] All deals have visible timers
- [ ] Evidence upload works
- [ ] Dispute TTL starts correctly when issue raised
- [ ] Money summary displays correctly

**Feedback Collection**:
- Quick user interviews (5-10 min each)
- Document any confusion points
- Note UI/UX issues

**Success Criteria**:
- No critical bugs blocking deals
- Users can complete basic flow
- Timers always visible

---

### Days 3-10: Main Run

**Target**: Ramp to 10-30 deals total

**Focus Areas**:
- Daily ops checks (see `/docs/INCIDENT_RUNBOOK.md`)
- Record feedback and metrics daily
- Monitor dispute frequency
- Track settlement completion rate

**Daily Ops Cadence**:

**Morning (9:00 AM)**:
- [ ] Check dispute list (sorted by TTL ascending)
- [ ] Resolve any urgent disputes (approaching TTL)
- [ ] Verify admin constraints (no free-form outcomes)
- [ ] Check for errors in logs

**Midday (2:00 PM)**:
- [ ] Verify new deals entering INSPECTION have AUTO_APPROVE timer
- [ ] Check evidence completeness for delivered deals
- [ ] Monitor active deals count

**Evening (5:00 PM)**:
- [ ] Export metrics from ops dashboard
- [ ] Compile top 3 friction points
- [ ] Update feedback log
- [ ] Document any incidents

**Weekly Review (End of Week 1, Week 2)**:
- Aggregate metrics
- Analyze trends
- Identify template tuning needs
- Prepare weekly summary

---

### Days 11-13: Tuning + v2 Templates (If Needed)

**Decision Point**: Based on feedback and metrics, decide if template tuning needed

**If Tuning Needed**:
1. [ ] Analyze feedback patterns
2. [ ] Identify parameter adjustments:
   - Inspection TTL too short/long?
   - Dispute TTL too short/long?
   - Holdback ratio too high/low?
   - Offset caps need adjustment?
3. [ ] Create `MN_USED_CAR_PRIVATE_v2.json` with adjusted parameters
4. [ ] Deploy v2 template
5. [ ] New deals use v2; existing deals remain pinned to v1
6. [ ] Monitor v2 performance

**If No Tuning Needed**:
- Continue with v1
- Document rationale
- Prepare for expansion decision

**Validation**:
- v2 template loads correctly
- New deals use v2
- Existing deals remain on v1
- No core code changes

---

### Day 14: Decision Day

**Tasks**:
- [ ] Produce Go/No-Go report (see `/docs/GO_NO_GO_REPORT_TEMPLATE.md`)
- [ ] Review all metrics
- [ ] Review all feedback
- [ ] Make expansion decision

**Expansion Options** (if Go):
- MN × USED_CAR_DEALER
- MN × REAL_ESTATE_SALE
- MN × REAL_ESTATE_RENTAL
- KR × USED_CAR_PRIVATE (new country)

**Decision Criteria**:
- Settlement completion rate > 90%
- Average time to settle < 7 days
- Dispute frequency < 10%
- No critical bugs
- User feedback positive (> 70% would use again)

---

## Daily Ops Cadence (Detailed)

### Morning Check (9:00 AM)

**Dispute List Review**:
1. Navigate to `/admin/disputes`
2. Sort by TTL ascending (most urgent first)
3. Check for disputes approaching TTL expiry (< 24 hours remaining)
4. Resolve urgent disputes (constrained outcomes only)
5. Verify audit reason entered for all resolutions

**Timer Verification**:
1. Check deals in INSPECTION state
2. Verify AUTO_APPROVE timer visible
3. Check deals in ISSUE state
4. Verify DISPUTE_TTL timer visible

**Error Check**:
1. Review application logs
2. Check error tracking service (if available)
3. Identify patterns or recurring issues

---

### Midday Check (2:00 PM)

**New Deals Verification**:
1. Check deals that entered INSPECTION today
2. Verify AUTO_APPROVE timer created and visible
3. Verify timer duration matches template (3 days)

**Evidence Completeness**:
1. Check delivered deals
2. Verify evidence metadata present
3. Check evidence types match requirements

**Active Deals Count**:
1. Count deals by state:
   - CREATED: X
   - FUNDED: Y
   - INSPECTION: Z
   - ISSUE: W
   - APPROVED: A
   - SETTLED: B

---

### Evening Check (5:00 PM)

**Metrics Export**:
1. Export from ops dashboard:
   - Settlement completion rate
   - Average time to settle
   - Dispute frequency
   - Evidence completeness
2. Calculate daily totals

**Friction Points**:
1. Compile top 3 friction points from:
   - User feedback
   - Support requests
   - Error logs
2. Document in feedback log

**Daily Summary**:
- Deals created: X
- Deals settled: Y
- Disputes opened: Z
- Issues identified: List
- Top friction points: 1, 2, 3

---

## Success Criteria

### Technical
- [ ] Pilot can run 10-30 deals without manual DB edits
- [ ] No illegal actions visible in UI
- [ ] Timers always visible (never hidden)
- [ ] Clear auditability: timeline reconstructs every deal
- [ ] Template tuning requires parameter updates only (no core edits)

### Operational
- [ ] Daily ops checks completed
- [ ] All disputes resolved within TTL
- [ ] No critical incidents
- [ ] Metrics collected daily

### User Experience
- [ ] Users can complete deals successfully
- [ ] Feedback collected from all user types
- [ ] Common issues documented

---

## Rollback Plan

### If Critical Issues Arise

1. **Disable New Deal Creation**:
   - Set feature flag: `pilot.enabled = false`
   - OR: Disable deal creation endpoint
   - Existing deals continue to completion

2. **Allow Existing Deals to Complete**:
   - Do not cancel active deals
   - Let timers expire naturally
   - Process disputes normally

3. **Export for Audit**:
   - Export all deal timelines
   - Export all ledger entries
   - Store for audit/reconciliation

4. **Communication**:
   - Notify users of temporary pause
   - Explain reason (if appropriate)
   - Provide timeline for resolution

### Rollback Triggers

- Settlement completion rate < 50%
- Critical security issue
- Data integrity concerns
- User safety issues
- System unavailability > 1 hour

---

## Communication Plan

### Daily Standup (15 min)
- Operator: Dispute status, metrics
- Coordinator: User feedback, support issues
- Engineer: System health, bugs
- Analyst: Trends, patterns

### Weekly Review (1 hour)
- Review metrics vs targets
- Discuss feedback patterns
- Identify template tuning needs
- Plan for next week

### Final Review (2 hours)
- Present Go/No-Go report
- Review all metrics
- Discuss expansion options
- Make decision

---

## Next Steps

1. **Feature Flags**: See `/docs/FEATURE_FLAGS.md`
2. **Ops Dashboard**: See `/docs/OPS_DASHBOARD_SPEC.md`
3. **Incident Runbook**: See `/docs/INCIDENT_RUNBOOK.md`
4. **Go/No-Go Report**: See `/docs/GO_NO_GO_REPORT_TEMPLATE.md`
