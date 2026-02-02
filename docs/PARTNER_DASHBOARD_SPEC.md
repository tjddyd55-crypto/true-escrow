# Partner Dashboard Specification

**Purpose**: Give partners visibility without admin power  
**Phase 8**: Monetization & Partner Commercialization

---

## Objective

Design a partner dashboard that:
- Provides visibility into deals, revenue, and metrics
- Does not expose escrow internals
- Is read-only (no override or admin actions)
- Helps partners understand their business performance

---

## Core Principles

### 1. Read-Only Access

**Critical**: Partners have read-only access to their data

**Forbidden**:
- No admin actions
- No override capabilities
- No settlement modifications
- No dispute resolution (except evidence upload)

**Allowed**:
- View deals
- View revenue/fees
- View metrics
- Upload evidence (for their deals)
- Download invoices

---

### 2. No Escrow Internals

**Critical**: Partners never see escrow internals

**Hidden**:
- Escrow Ledger entries
- Admin actions
- Internal dispute resolution details
- Other partners' data

**Visible**:
- Deal status
- Deal timeline (user-facing events)
- Revenue/fees
- Metrics (aggregated)

---

### 3. Business-Focused

**Focus**: Dashboard helps partners understand business performance

**Metrics**:
- Deal volume
- Settled amount
- Platform fees
- Dispute rate
- Average settlement time

---

## Dashboard Sections

### 1. Overview Dashboard

**Purpose**: High-level business metrics at a glance

**Metrics**:

#### A. Deal Volume
- **Total Deals**: All deals (all time)
- **Active Deals**: Deals in progress (not SETTLED)
- **Settled Deals**: Deals that reached SETTLED (this month, all time)
- **Trend**: Month-over-month growth

**Display**:
```
Total Deals: 150
Active Deals: 12
Settled This Month: 25
Trend: +15% vs last month
```

---

#### B. Settled Amount
- **Total Settled**: Total amount of all settled deals (all time)
- **This Month**: Total amount settled this month
- **Average Deal Size**: Average deal amount
- **Trend**: Month-over-month growth

**Display**:
```
Total Settled: ₩1,500,000,000
This Month: ₩250,000,000
Average Deal Size: ₩10,000,000
Trend: +20% vs last month
```

---

#### C. Platform Fees
- **Total Fees**: Total platform fees paid (all time)
- **This Month**: Platform fees this month
- **Average Fee per Deal**: Average fee per deal
- **Trend**: Month-over-month growth

**Display**:
```
Total Fees: ₩22,500,000
This Month: ₩3,750,000
Average Fee per Deal: ₩150,000
Trend: +20% vs last month
```

---

#### D. Dispute Rate
- **Total Disputes**: Number of disputes (all time)
- **This Month**: Disputes this month
- **Dispute Rate**: Percentage of deals with disputes
- **Trend**: Month-over-month change

**Display**:
```
Total Disputes: 15
This Month: 3
Dispute Rate: 12%
Trend: -2% vs last month
```

---

#### E. Average Settlement Time
- **Average Time**: Average time from CREATED to SETTLED
- **This Month**: Average time this month
- **Trend**: Month-over-month change

**Display**:
```
Average Settlement Time: 5.2 days
This Month: 4.8 days
Trend: -0.4 days vs last month
```

---

### 2. Deals List

**Purpose**: View all deals with filtering and search

**Columns**:
- Deal ID
- Category
- Status (CREATED, FUNDED, DELIVERED, INSPECTION, APPROVED, ISSUE, SETTLED)
- Total Amount
- Created Date
- Settled Date (if SETTLED)
- Actions (View Details, Upload Evidence)

**Filters**:
- Status (multi-select)
- Category (multi-select)
- Date Range (created date, settled date)
- Amount Range (min, max)

**Search**:
- Deal ID
- Buyer/Seller name (if applicable)

**Sorting**:
- Created Date (newest first, oldest first)
- Settled Date (newest first, oldest first)
- Amount (highest first, lowest first)

---

### 3. Deal Details

**Purpose**: View individual deal details

**Sections**:

#### A. Deal Information
- Deal ID
- Category
- Status
- Total Amount
- Created Date
- Settled Date (if SETTLED)
- Buyer/Seller information (if applicable)

#### B. Timeline (User-Facing Events)
- Deal created
- Funds deposited
- Delivery confirmed
- Inspection started
- Approved/Settled
- Issue raised (if applicable)
- Dispute resolved (if applicable)

**Note**: Timeline shows user-facing events only, not escrow internals

#### C. Money Summary
- Total Amount
- Immediate Amount (released on DELIVERED)
- Holdback Amount (released on SETTLED)
- Released Amount (if SETTLED)

**Note**: Money summary shows amounts only, not ledger entries

#### D. Evidence (If Applicable)
- Evidence uploaded
- Evidence type
- Upload date
- View/Download evidence

**Actions**:
- Upload Evidence (if deal allows)

---

### 4. Revenue & Fees

**Purpose**: View revenue and fee details

**Sections**:

#### A. Fee Summary
- Total Fees (all time)
- This Month
- Average Fee per Deal
- Trend

#### B. Fee Breakdown by Category
- USED_CAR_PRIVATE: X deals, ₩Y fees
- USED_CAR_DEALER: X deals, ₩Y fees
- REAL_ESTATE_SALE: X deals, ₩Y fees

#### C. Subscription Status (If Applicable)
- Current Tier
- Monthly Fee
- Deal Limit
- Renewal Date

#### D. Invoice History
- Invoice Number
- Invoice Date
- Due Date
- Amount
- Status (PAID, OVERDUE, PENDING)
- Download Invoice (PDF)

---

### 5. Metrics & Analytics

**Purpose**: Detailed analytics and trends

**Charts**:

#### A. Deal Volume Trend
- Line chart: Deals per month (last 12 months)
- Shows growth trend

#### B. Revenue Trend
- Line chart: Platform fees per month (last 12 months)
- Shows revenue growth

#### C. Dispute Rate Trend
- Line chart: Dispute rate per month (last 12 months)
- Shows dispute trend

#### D. Settlement Time Trend
- Line chart: Average settlement time per month (last 12 months)
- Shows efficiency trend

#### E. Category Breakdown
- Pie chart: Deals by category
- Shows category distribution

---

## Permissions

### Read-Only Access

**Allowed Actions**:
- View deals
- View revenue/fees
- View metrics
- Upload evidence (for their deals)
- Download invoices
- Export data (CSV, PDF)

**Forbidden Actions**:
- Modify deals
- Override settlement
- Resolve disputes (except evidence upload)
- Access admin functions
- View other partners' data
- View escrow internals

---

### Data Access

**Partner Can See**:
- Their own deals only
- Their own revenue/fees only
- Their own metrics only
- Public deal information (status, timeline, amounts)

**Partner Cannot See**:
- Escrow Ledger entries
- Admin actions
- Internal dispute resolution details
- Other partners' data
- System internals

---

## UI/UX Requirements

### Design Principles

1. **Clear and Simple**: Easy to understand at a glance
2. **Business-Focused**: Metrics that matter to partners
3. **Actionable**: Clear next steps (upload evidence, download invoice)
4. **Responsive**: Works on desktop and mobile

---

### Navigation

**Main Menu**:
- Overview (default)
- Deals
- Revenue & Fees
- Metrics & Analytics
- Settings (profile, subscription)

---

### Responsive Design

**Desktop**:
- Full dashboard with all sections
- Charts and graphs
- Detailed tables

**Mobile**:
- Simplified view
- Key metrics first
- Collapsible sections

---

## Acceptance Criteria

### ✅ Partner Never Sees Escrow Internals

**Test**: Partner dashboard does not expose escrow internals

**How**:
- No Escrow Ledger entries visible
- No admin actions visible
- No internal dispute resolution details
- Only user-facing events in timeline

---

### ✅ Read-Only Access

**Test**: Partners cannot perform admin actions

**How**:
- No override buttons
- No settlement modification
- No dispute resolution (except evidence upload)
- All actions are read-only or evidence upload only

---

### ✅ Business-Focused Metrics

**Test**: Dashboard shows metrics that matter to partners

**How**:
- Deal volume, settled amount, platform fees visible
- Dispute rate, settlement time visible
- Trends and analytics available
- Clear business performance indicators

---

## Implementation Notes

### Dashboard Service

**New Service**: `PartnerDashboardService` (separate from Escrow services)

**Responsibilities**:
- Aggregate partner metrics
- Query partner deals (read-only)
- Query partner revenue (read-only)
- Generate charts/analytics

**No Escrow Logic**: Dashboard Service does not touch Escrow Ledger or modify deals

---

### API Endpoints

**Read-Only Endpoints**:
- `GET /api/partners/{partnerId}/overview` - Overview metrics
- `GET /api/partners/{partnerId}/deals` - Deal list
- `GET /api/partners/{partnerId}/deals/{dealId}` - Deal details
- `GET /api/partners/{partnerId}/revenue` - Revenue/fees
- `GET /api/partners/{partnerId}/invoices` - Invoice history
- `GET /api/partners/{partnerId}/metrics` - Analytics

**Action Endpoints** (Limited):
- `POST /api/partners/{partnerId}/deals/{dealId}/evidence` - Upload evidence
- `GET /api/partners/{partnerId}/invoices/{invoiceId}/download` - Download invoice

---

### Frontend Components

**Components**:
- `PartnerOverview.tsx` - Overview dashboard
- `DealList.tsx` - Deal list with filters
- `DealDetails.tsx` - Deal details view
- `RevenueSummary.tsx` - Revenue/fees summary
- `MetricsCharts.tsx` - Analytics charts

---

## Next Steps

1. **Revenue Simulation**: See `/docs/REVENUE_SIMULATION.md`
2. **Go-To-Market Playbook**: See `/docs/GO_TO_MARKET_PLAYBOOK.md`
