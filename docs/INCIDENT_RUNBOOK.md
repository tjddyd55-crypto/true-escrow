# Incident Runbook

**Purpose**: Prevent pilot failure with simple playbook for common incidents  
**Phase 6**: SLA, escalation, rollback procedures

---

## Severity Levels

### SEV0: Critical (Funds/Ledger)

**Definition**: 
- Funds incorrect / double release
- Ledger inconsistency
- Data integrity issues

**Impact**: 
- Financial loss
- Legal/compliance risk
- System trust compromised

**Response Time**: Immediate (< 15 minutes)

---

### SEV1: High (Blocking Operations)

**Definition**:
- Disputes stuck (cannot resolve)
- Timers not visible
- Admin cannot resolve disputes
- Deal state transitions blocked

**Impact**:
- Pilot operations blocked
- User experience severely degraded
- SLA violations

**Response Time**: < 1 hour

---

### SEV2: Medium (UX/Performance)

**Definition**:
- UX bugs (non-blocking)
- Translation issues
- Slow pages
- Minor display errors

**Impact**:
- User experience degraded
- Support requests increase
- Pilot continues but with friction

**Response Time**: < 4 hours (business hours)

---

### SEV3: Low (Cosmetics)

**Definition**:
- Minor UI cosmetics
- Typos
- Styling issues

**Impact**:
- Minimal user impact
- Professional appearance

**Response Time**: Next business day

---

## Immediate Actions

### SEV0: Critical (Funds/Ledger)

**Step 1: Disable New Pilot Deals**
```yaml
# Set in application-pilot.yml or via feature flag
pilot:
  enabled: false
```

**Step 2: Preserve Logs + Export Affected Deal Timelines**
```bash
# Export timelines for affected deals
# Use timeline export API or database query
# Store in secure location for audit
```

**Step 3: Identify Idempotency Keys + Ledger Entries**
```bash
# Query ledger for affected deals
# Identify duplicate entries (if any)
# Document idempotency keys
```

**Step 4: Fix Only Minimal Patch**
- Do NOT redesign core
- Fix only the specific issue
- Test fix thoroughly
- Deploy fix
- Re-enable pilot if fix successful

**Step 5: Communication**
- Notify pilot coordinator immediately
- Document incident in incident log
- Prepare post-mortem

---

### SEV1: High (Blocking Operations)

**Step 1: Check Dispute TTL and Timer Display**
- Verify disputes have TTL timers
- Check timer visibility in UI
- Verify timer expiration logic

**Step 2: Verify Admin Role Access**
- Check admin can access dispute list
- Verify admin can resolve disputes
- Check role permissions

**Step 3: Apply Hotfix Behind Feature Flag (If Possible)**
- If fix can be feature-flagged, apply hotfix
- Test in staging first (if time permits)
- Deploy to production
- Monitor closely

**Step 4: If Hotfix Not Possible**
- Document workaround
- Escalate to engineer
- Consider temporary manual process (if safe)

---

### SEV2/SEV3: Medium/Low

**Action**: Defer unless blocks pilot

**Process**:
1. Document issue in bug tracker
2. Prioritize for next sprint
3. Fix during regular maintenance window
4. If becomes blocking, escalate to SEV1

---

## Escalation Path

### Level 1: Operator

**Responsibilities**:
- Initial incident assessment
- Apply immediate actions (disable pilot, export data)
- Document incident
- Escalate if cannot resolve

**Escalation Criteria**:
- SEV0 or SEV1
- Cannot resolve within 15 minutes (SEV0) or 1 hour (SEV1)

---

### Level 2: On-Call Engineer

**Responsibilities**:
- Technical investigation
- Apply hotfixes
- System health checks
- Escalate if fix requires core changes

**Escalation Criteria**:
- Fix requires core code changes (not allowed)
- System unavailability > 1 hour
- Data integrity concerns

---

### Level 3: Pilot Coordinator

**Responsibilities**:
- Business decision making
- User communication
- Pilot pause/resume decisions
- Resource allocation

**Escalation Criteria**:
- Pilot must be paused
- Legal/compliance concerns
- Major scope changes needed

---

### Level 4: Decision Owner

**Responsibilities**:
- Final decisions on pilot continuation
- Resource approval
- Strategic direction

**Escalation Criteria**:
- Pilot cancellation consideration
- Major policy changes
- Resource constraints

---

## Rollback Strategy

### Prefer Config Rollback (Flags/Templates)

**Step 1: Disable Feature Flag**
```yaml
pilot:
  enabled: false
```

**Step 2: Revert Template Version (If Needed)**
```yaml
pilot:
  template-version: v1  # Revert from v2 if needed
```

**Step 3: Restart Application**
- No code changes required
- Instant rollback
- Existing deals continue normally

---

### Code Rollback (Only If Config Insufficient)

**Step 1: Identify Commit to Revert To**
- Find last known good commit
- Verify commit does not break existing deals

**Step 2: Revert Code**
```bash
git revert <commit-hash>
# OR
git reset --hard <commit-hash>
```

**Step 3: Deploy Reverted Code**
- Test in staging first
- Deploy to production
- Monitor closely

**Step 4: Document Rollback**
- Reason for rollback
- What was reverted
- Impact on existing deals

---

## Common Incidents & Solutions

### Incident 1: Duplicate Ledger Entries

**Symptom**: Same idempotency key creates multiple ledger entries

**Cause**: Idempotency check failure

**Solution**:
1. Disable pilot (SEV0)
2. Export affected deal timelines
3. Identify duplicate entries
4. Fix idempotency check logic
5. Test fix thoroughly
6. Re-enable pilot

**Prevention**: 
- Test idempotency in staging
- Monitor duplicate entry metrics

---

### Incident 2: Timer Not Visible

**Symptom**: Deals in INSPECTION/ISSUE but timer not shown

**Cause**: Timer creation failure or UI bug

**Solution**:
1. Check timer creation in backend logs
2. Verify timer exists in database
3. Check UI timer display logic
4. Fix timer creation or display
5. Verify fix with test deal

**Prevention**:
- Timer SLA monitoring
- Automated tests for timer visibility

---

### Incident 3: Admin Cannot Resolve Dispute

**Symptom**: Admin sees dispute but cannot select resolution

**Cause**: Role permission issue or UI bug

**Solution**:
1. Verify admin role in database
2. Check role permission logic
3. Verify UI role check
4. Fix permission or UI bug
5. Test with admin user

**Prevention**:
- Role permission tests
- Admin workflow tests

---

### Incident 4: Deal Stuck in State

**Symptom**: Deal in same state > 7 days

**Cause**: State transition failure or timer not firing

**Solution**:
1. Check deal state in database
2. Check timer status
3. Verify state transition logic
4. Manually trigger transition (if safe)
5. Fix underlying issue

**Prevention**:
- Stuck deal monitoring
- Automated state transition tests

---

## Incident Log Template

```markdown
## Incident #XXX — [Title]

**Date**: YYYY-MM-DD HH:MM
**Severity**: SEV0/SEV1/SEV2/SEV3
**Reported By**: [Name]
**Resolved By**: [Name]
**Resolution Time**: [Duration]

**Description**: 
[What happened]

**Impact**:
[Who/what was affected]

**Root Cause**:
[Why it happened]

**Resolution**:
[How it was fixed]

**Prevention**:
[How to prevent recurrence]

**Lessons Learned**:
[Key takeaways]
```

---

## Acceptance Criteria

### On-Call Can Follow Without Guessing

- [ ] Severity levels clearly defined
- [ ] Immediate actions documented for each severity
- [ ] Escalation path clear
- [ ] Rollback strategy documented
- [ ] Common incidents have solutions

---

## Next Steps

1. **Pilot Launch Plan**: See `/docs/PILOT_LAUNCH_PLAN.md`
2. **Feature Flags**: See `/docs/FEATURE_FLAGS.md`
3. **Go/No-Go Report**: See `/docs/GO_NO_GO_REPORT_TEMPLATE.md`
