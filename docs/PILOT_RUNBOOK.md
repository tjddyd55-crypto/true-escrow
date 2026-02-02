# Pilot Runbook

**Purpose**: Run controlled pilot with real users and capture template tuning needs  
**Scope**: Start small, expand gradually  
**Duration**: 4-6 weeks recommended

---

## Pre-Pilot Checklist

### 1. Select Initial Scope

**Recommended Start**:
- **Country**: MN (Mongolia)
- **Category**: USED_CAR_PRIVATE
- **Target**: 10-30 deals

**Rationale**:
- Smaller market for controlled testing
- Used car has shorter cycles (3-day inspection)
- Easier to monitor and adjust

### 2. Enable Logging and Error Capture

**Backend**:
- [ ] Application logs configured (file + console)
- [ ] Error tracking enabled (if available)
- [ ] Database query logging (for debugging)

**Frontend**:
- [ ] Error logging to console
- [ ] User action tracking (if analytics available)
- [ ] Performance monitoring

### 3. Prepare Templates

- [ ] Country template loaded: `MN_USED_CAR_PRIVATE_v1.json`
- [ ] Template parameters verified:
  - Inspection TTL: 3 days
  - Dispute TTL: 48 hours
  - Holdback: 15%
  - Immediate: 85%

### 4. User Onboarding

- [ ] Test users created (buyer, seller, admin)
- [ ] User guides prepared (if needed)
- [ ] Support channel established (email/Slack/etc.)

### 5. Monitoring Setup

- [ ] Dashboard for key metrics (if available)
- [ ] Alerting configured (if available)
- [ ] Daily check-in schedule established

---

## Daily Operations

### Morning Check (9:00 AM)

1. **Check Dispute List**
   - Navigate to `/admin/disputes`
   - Sort by TTL ascending (most urgent first)
   - Verify all disputes have evidence
   - Check for disputes approaching TTL expiry

2. **Review Errors**
   - Check application logs for errors
   - Check error tracking service (if available)
   - Identify patterns or recurring issues

3. **Verify Admin Constraints**
   - Ensure admin cannot type arbitrary outcomes
   - Verify audit reasons are required
   - Confirm resolution dropdown shows only allowed outcomes

### Afternoon Check (2:00 PM)

1. **Review Active Deals**
   - Check deals in INSPECTION state
   - Verify AUTO_APPROVE timers visible
   - Check for stuck deals (unusual state)

2. **Monitor Metrics**
   - Settlement completion rate
   - Average time to settle
   - Dispute frequency
   - Evidence completeness

3. **User Support**
   - Respond to user questions
   - Document common issues
   - Update FAQ if needed

### End of Day (5:00 PM)

1. **Daily Summary**
   - Deals created: X
   - Deals settled: Y
   - Disputes opened: Z
   - Issues identified: List

2. **Document Feedback**
   - Record user feedback (see `/docs/PILOT_FEEDBACK_FORM.md`)
   - Note template parameter concerns
   - Document UI/UX issues

---

## Success Metrics

### Primary Metrics

1. **Settlement Completion Rate**
   - Target: > 90% of deals reach SETTLED
   - Formula: `SETTLED deals / Total deals created`
   - Track weekly

2. **Average Time to Settle**
   - Target: < 7 days for used car
   - Formula: `Average(settlement_date - creation_date)`
   - Track weekly

3. **Dispute Frequency**
   - Target: < 10% of deals
   - Formula: `ISSUE deals / Total deals`
   - Track weekly

4. **Evidence Completeness**
   - Target: 100% of issues have evidence
   - Formula: `Issues with evidence / Total issues`
   - Track per issue

### Secondary Metrics

- **Admin Intervention Rate**: How often admin must resolve disputes
- **Timer Visibility**: User reports of hidden timers (should be 0)
- **User Confusion Points**: Common questions about timers/money
- **API Error Rate**: Failed API calls / Total API calls

---

## Weekly Review

### Week 1: Baseline

- Establish baseline metrics
- Identify initial issues
- Document user feedback

### Week 2-3: Observation

- Monitor metrics trends
- Collect detailed feedback
- Document template concerns

### Week 4: Analysis

- Analyze metrics vs targets
- Review feedback patterns
- Identify template adjustments needed

### Week 5-6: Adjustment (If Needed)

- Update template parameters (create v2)
- Test with new deals
- Monitor impact

---

## Rollback Plan

### If Critical Issues Arise

1. **Disable New Deal Creation**
   - Feature flag: `pilot.enabled = false`
   - OR: Disable deal creation endpoint
   - Existing deals continue to completion

2. **Allow Existing Deals to Complete**
   - Do not cancel active deals
   - Let timers expire naturally
   - Process disputes normally

3. **Export Timeline/Ledger for Audit**
   - Export all deal timelines
   - Export all ledger entries
   - Store for audit/reconciliation

4. **Communication**
   - Notify users of temporary pause
   - Explain reason (if appropriate)
   - Provide timeline for resolution

### Rollback Triggers

- Settlement completion rate < 50%
- Critical security issue
- Data integrity concerns
- User safety issues

---

## Template Tuning Process

### Step 1: Collect Feedback

Use `/docs/PILOT_FEEDBACK_FORM.md` to collect:
- User confusion points
- Timer clarity
- Money display clarity
- Evidence upload issues
- Admin constraint feedback

### Step 2: Analyze Metrics

Review:
- Time-to-settle trends
- Dispute rate patterns
- Admin intervention frequency
- Error patterns

### Step 3: Identify Adjustments

**Common Adjustments**:
- Inspection TTL too short/long → Adjust `inspectionTtlDays`
- Dispute TTL too short/long → Adjust `disputeTtlHours`
- Holdback too high/low → Adjust `holdbackRatio`
- Offset caps too high/low → Adjust `offsetCapsByReasonCode`

### Step 4: Create New Template Version

1. Copy existing template: `MN_USED_CAR_PRIVATE_v1.json`
2. Create new version: `MN_USED_CAR_PRIVATE_v2.json`
3. Update parameters
4. Deploy new template
5. New deals use v2; existing deals stay pinned to v1

### Step 5: Monitor Impact

- Track metrics after template change
- Compare v1 vs v2 performance
- Adjust further if needed

---

## Common Issues & Solutions

### Issue: Users Confused About Timers

**Symptoms**: Users ask "Where is the timer?" or "When does it expire?"

**Solution**:
- Verify timer visibility in UI
- Add timer explanation text
- Consider timer notification emails (future)

### Issue: Users Don't Understand Holdback

**Symptoms**: Users ask "When do I get my money?" or "What is holdback?"

**Solution**:
- Improve Money Summary UI text
- Add tooltips/explanations
- Consider user guide

### Issue: Evidence Upload Difficult

**Symptoms**: Users fail to upload evidence or upload wrong types

**Solution**:
- Improve upload UI
- Add file type validation
- Provide examples

### Issue: Admin Needs More Resolution Options

**Symptoms**: Admin reports "I need outcome X but it's not in dropdown"

**Solution**:
- **Do NOT add free-form input** (non-negotiable)
- Review if outcome should be added to rules
- If valid, add to template's allowed outcomes
- Create new template version

---

## Pilot Completion

### Final Report

Document:
1. **Metrics Summary**
   - Settlement completion rate
   - Average time to settle
   - Dispute frequency
   - Evidence completeness

2. **Feedback Summary**
   - User confusion points
   - Template concerns
   - UI/UX issues

3. **Template Adjustments**
   - Changes made (if any)
   - Rationale for changes
   - Impact of changes

4. **Recommendations**
   - Expand to more countries/categories?
   - Additional template parameters needed?
   - UI/UX improvements needed?

### Next Steps

- Review final report
- Decide on expansion (more countries/categories)
- Plan production rollout (if successful)
- Address critical issues before expansion

---

## Support Contacts

- **Technical Issues**: [tech-support@example.com]
- **User Support**: [user-support@example.com]
- **Escalation**: [escalation@example.com]

---

## Appendix: Daily Checklist Template

```
Date: YYYY-MM-DD

Morning Check (9:00 AM):
[ ] Dispute list reviewed
[ ] Errors checked
[ ] Admin constraints verified

Afternoon Check (2:00 PM):
[ ] Active deals reviewed
[ ] Metrics monitored
[ ] User support provided

End of Day (5:00 PM):
[ ] Daily summary completed
[ ] Feedback documented
[ ] Issues logged

Deals Created: ___
Deals Settled: ___
Disputes Opened: ___
Issues Identified: ___
```

---

## Next Steps

1. **Pilot Feedback Form**: See `/docs/PILOT_FEEDBACK_FORM.md`
2. **Country Template Matrix**: See `/docs/COUNTRY_TEMPLATE_MATRIX.md`
3. **Demo Script**: See `/docs/DEMO_SCRIPT.md`
