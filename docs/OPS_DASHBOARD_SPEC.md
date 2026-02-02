# Ops Dashboard Specification

**Purpose**: Provide ops visibility to run pilot safely without manual DB queries  
**Phase 6**: Minimal, high-signal dashboard for MN × USED_CAR_PRIVATE pilot

---

## Dashboard Pages (Minimum)

### A. Pilot Overview (MN × USED_CAR_PRIVATE)

**Purpose**: High-level pilot health at a glance

**Metrics Display**:
- Total deals created (count)
- Deals by state (pie chart or bar chart):
  - CREATED: X
  - FUNDED: Y
  - DELIVERED: Z
  - INSPECTION: A
  - APPROVED: B
  - SETTLED: C
  - ISSUE: D
- Average time to settle (hours)
- Settlement completion rate (%)
- Dispute rate (%)

**Filters**:
- Date range (default: last 7 days)
- State filter (optional)

**Click-through**: Click on state → filtered deal list

---

### B. Disputes & TTL

**Purpose**: Monitor dispute resolution and TTL compliance

**Metrics Display**:
- Active disputes (count)
- Disputes by TTL urgency:
  - < 24 hours remaining: X (urgent)
  - 24-48 hours remaining: Y
  - > 48 hours remaining: Z
- Disputes by reason code (bar chart)
- Admin intervention rate (% resolved by operator vs TTL default)
- Average dispute resolution time (hours)

**Table View**:
- Deal ID
- Reason code
- TTL remaining (countdown)
- Status (OPEN/RESOLVED)
- Created date
- Actions: View detail, Resolve

**Filters**:
- Status (OPEN/RESOLVED)
- Reason code
- TTL urgency (< 24h, 24-48h, > 48h)

**Click-through**: Click deal ID → dispute detail page

---

### C. Settlement Health

**Purpose**: Monitor settlement completion and timing

**Metrics Display**:
- Settlement completion rate (% deals reaching SETTLED)
- Average time to settle (hours)
- Time to settle distribution (histogram):
  - < 3 days: X
  - 3-5 days: Y
  - 5-7 days: Z
  - > 7 days: W
- Stuck deals (deals in same state > 7 days)

**Table View** (Stuck Deals):
- Deal ID
- Current state
- Days in state
- Last activity date
- Actions: View detail

**Filters**:
- Date range
- State filter

---

### D. Evidence Completeness

**Purpose**: Monitor evidence requirements and compliance

**Metrics Display**:
- Evidence completeness rate (% issues with evidence)
- Evidence by type (pie chart):
  - PHOTO: X
  - VIDEO: Y
  - REPORT: Z
- Issues without evidence (count) - should be 0 if template requires
- Average evidence count per issue

**Table View** (Issues without Evidence):
- Deal ID
- Issue ID
- Reason code
- Created date
- Actions: View detail, Add evidence (if allowed)

**Filters**:
- Date range
- Reason code

---

### E. Error/Incident Feed

**Purpose**: Monitor system errors and incidents

**Metrics Display**:
- Error rate (errors per hour)
- Error by type (bar chart):
  - API errors: X
  - Validation errors: Y
  - System errors: Z
- Critical incidents (count)
- Last 24 hours error trend (line chart)

**Table View** (Recent Errors):
- Timestamp
- Error type
- Error message
- Deal ID (if applicable)
- User ID (if applicable)
- Actions: View detail, View logs

**Filters**:
- Error type
- Severity (CRITICAL/HIGH/MEDIUM/LOW)
- Date range

---

## Core Metrics (Daily)

### 1. Deals Created (Count)
- **Query**: `COUNT(*) WHERE category = 'USED_CAR_PRIVATE' AND country = 'MN' AND created_at >= DATE`
- **Display**: Number + trend (↑/↓ vs previous day)

### 2. Deals by State
- **Query**: `GROUP BY state COUNT(*) WHERE category = 'USED_CAR_PRIVATE' AND country = 'MN'`
- **Display**: Pie chart or bar chart

### 3. Average Time to Settle (Hours)
- **Query**: `AVG(settled_at - created_at) WHERE state = 'SETTLED' AND category = 'USED_CAR_PRIVATE' AND country = 'MN'`
- **Display**: Number + target indicator (< 7 days = green)

### 4. Dispute Rate (%)
- **Query**: `COUNT(*) WHERE state = 'ISSUE' / COUNT(*) WHERE category = 'USED_CAR_PRIVATE' AND country = 'MN'`
- **Display**: Percentage + target indicator (< 10% = green)

### 5. Admin Intervention Rate (%)
- **Query**: `COUNT(*) WHERE dispute.resolved_by = 'OPERATOR' / COUNT(*) WHERE dispute.status = 'RESOLVED'`
- **Display**: Percentage

### 6. Timer SLA
- **AUTO_APPROVE Visibility**: `COUNT(*) WHERE state = 'INSPECTION' AND timer.type = 'AUTO_APPROVE' AND timer.active = true / COUNT(*) WHERE state = 'INSPECTION'`
- **DISPUTE_TTL Visibility**: `COUNT(*) WHERE state = 'ISSUE' AND timer.type = 'DISPUTE_TTL' AND timer.active = true / COUNT(*) WHERE state = 'ISSUE'`
- **Display**: Percentage (should be 100%)

### 7. Ledger Integrity
- **Duplicate Entries**: `COUNT(*) WHERE idempotency_key IN (SELECT idempotency_key GROUP BY idempotency_key HAVING COUNT(*) > 1)`
- **Balance Checks**: Sum of HOLD entries = Sum of RELEASE/REFUND/OFFSET entries per deal
- **Display**: Count (should be 0) + alert if > 0

---

## Required Queries (Implementation Guidance)

### Option 1: API Endpoint (Recommended)

**Endpoint**: `GET /api/admin/pilot/metrics`

**Query Parameters**:
- `country` (required): e.g., "MN"
- `category` (required): e.g., "USED_CAR_PRIVATE"
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response**:
```json
{
  "success": true,
  "data": {
    "dealsCreated": 25,
    "dealsByState": {
      "CREATED": 2,
      "FUNDED": 3,
      "DELIVERED": 1,
      "INSPECTION": 5,
      "APPROVED": 2,
      "SETTLED": 10,
      "ISSUE": 2
    },
    "averageTimeToSettle": 120.5,
    "disputeRate": 0.08,
    "adminInterventionRate": 0.5,
    "timerSla": {
      "autoApproveVisible": 1.0,
      "disputeTtlVisible": 1.0
    },
    "ledgerIntegrity": {
      "duplicateEntries": 0,
      "balanceChecks": true
    }
  }
}
```

**Implementation**:
- Create `AdminMetricsService` to aggregate metrics
- Query database using existing repositories
- Calculate metrics in service layer
- Return JSON response

---

### Option 2: Server-Side Rendered Page

**If API endpoint not available**:
- Create admin page at `/admin/pilot/dashboard`
- Pull data from existing admin APIs:
  - `/api/admin/disputes`
  - `/api/deals` (with filters)
  - Timeline aggregation
- Render metrics server-side
- Use existing authentication/authorization

---

## UI Requirements

### Read-Only Dashboards
- All dashboards are read-only (no mutations)
- Data refresh: Auto-refresh every 60 seconds (optional)
- Manual refresh button available

### Filters
- Date range picker (default: last 7 days)
- State filter (dropdown)
- Reason code filter (dropdown, for disputes)
- Country/Category filter (pre-set to MN/USED_CAR_PRIVATE for pilot)

### Click-Through Navigation
- Click deal ID → `/deals/{deal-id}` (deal detail page)
- Click dispute → `/admin/disputes/{dispute-id}/resolve` (dispute detail)
- Click timeline → `/deals/{deal-id}/timeline` (timeline view)

### Responsive Design
- Desktop: Full dashboard with all metrics
- Mobile: Simplified view with key metrics only

---

## Acceptance Criteria

### Ops Can Answer Within 30 Seconds

**Question**: "How many deals are stuck? Where? Any urgent disputes?"

**Dashboard Should Show**:
1. Stuck deals count (deals in same state > 7 days)
2. Stuck deals table with:
   - Deal ID
   - Current state
   - Days in state
   - Last activity
3. Urgent disputes count (TTL < 24 hours)
4. Urgent disputes table with:
   - Deal ID
   - Reason code
   - TTL remaining
   - Status

### No New Risky Schema Changes

- Use existing database schema
- Use existing repositories
- No new tables required
- Aggregate from existing data

---

## Implementation Notes

### Backend Service

```java
@Service
public class AdminMetricsService {
    public PilotMetrics getPilotMetrics(String country, String category, LocalDate startDate, LocalDate endDate) {
        // Aggregate metrics from existing repositories
        // Return PilotMetrics DTO
    }
}
```

### Frontend Component

```typescript
// AdminDashboard.tsx
export function AdminDashboard() {
  const { metrics, loading } = usePilotMetrics('MN', 'USED_CAR_PRIVATE');
  
  return (
    <div>
      <PilotOverview metrics={metrics} />
      <DisputesAndTTL metrics={metrics} />
      <SettlementHealth metrics={metrics} />
      <EvidenceCompleteness metrics={metrics} />
      <ErrorFeed metrics={metrics} />
    </div>
  );
}
```

---

## Next Steps

1. **Pilot Launch Plan**: See `/docs/PILOT_LAUNCH_PLAN.md`
2. **Incident Runbook**: See `/docs/INCIDENT_RUNBOOK.md`
3. **Template Tuning**: See `/docs/TEMPLATE_TUNING_FRAMEWORK.md`
