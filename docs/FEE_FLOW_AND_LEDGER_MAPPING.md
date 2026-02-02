# Fee Flow & Ledger Mapping

**Purpose**: Ensure revenue collection never contaminates escrow funds  
**Phase 8**: Monetization & Partner Commercialization

---

## Objective

Design a fee flow and ledger mapping that:
- Keeps revenue completely separate from escrow funds
- Provides full audit trail
- Is ledger-safe and auditable
- Never references escrow accounts in revenue entries

---

## Core Principle

### Escrow Ledger ≠ Revenue Ledger

**Critical Separation**:
- **Escrow Ledger**: Tracks escrow funds only (HOLD, RELEASE, REFUND, OFFSET)
- **Revenue Ledger**: Tracks platform revenue only (PLATFORM_FEE, SUBSCRIPTION_FEE)

**No Mixing**: Revenue entries never reference escrow accounts

---

## Fee Flow

### Step-by-Step Flow

#### 1. Deal Settles (SETTLED State)

**Trigger**: Deal reaches SETTLED state

**Escrow Ledger** (unchanged, SEALED):
```
EscrowLedgerEntry:
  - type: RELEASE
  - amount: holdbackAmount
  - dealId: {dealId}
  - timestamp: {settlementTime}
```

**No revenue action yet** (fees charged after settlement)

---

#### 2. Escrow Ledger Finalized

**State**: SETTLED state confirmed

**Escrow Ledger Complete**:
- All escrow funds released
- All ledger entries finalized
- Escrow account balance: 0

**Escrow Ledger is SEALED** (no changes after SETTLED)

---

#### 3. Revenue Event Generated

**Trigger**: After SETTLED state confirmed

**Calculation**:
```java
platform_fee = totalAmount × feePercentage
```

**Where**:
- `totalAmount`: Deal total amount (from deal creation)
- `feePercentage`: Based on category and partner tier (from pricing model)

**Example**:
- Deal: ₩10,000,000
- Category: USED_CAR_PRIVATE
- Partner: Individual (1.5% fee)
- Platform fee: ₩10,000,000 × 0.015 = ₩150,000

**Revenue Event**:
```json
{
  "eventType": "PLATFORM_FEE",
  "dealId": "{dealId}",
  "partnerId": "{partnerId}",
  "amount": 150000,
  "currency": "KRW",
  "category": "USED_CAR_PRIVATE",
  "feePercentage": 0.015,
  "totalAmount": 10000000,
  "timestamp": "{settlementTime}",
  "status": "PENDING_INVOICE"
}
```

---

#### 4. Revenue Ledger Entry Created

**Action**: Create Revenue Ledger entry

**Revenue Ledger Entry**:
```java
RevenueLedgerEntry {
  id: {uuid}
  type: PLATFORM_FEE
  dealId: {dealId}
  partnerId: {partnerId}
  amount: 150000
  currency: "KRW"
  category: "USED_CAR_PRIVATE"
  feePercentage: 0.015
  totalAmount: 10000000
  timestamp: {settlementTime}
  status: PENDING_INVOICE
  invoiceId: null  // Set when invoice generated
}
```

**Key Points**:
- **No escrow account reference**: Revenue entry does not reference escrow accounts
- **Separate ledger**: Revenue Ledger is separate from Escrow Ledger
- **Full audit trail**: Every revenue entry is logged and auditable

---

#### 5. Invoice Generated (Monthly)

**Trigger**: Monthly billing cycle (1st of each month)

**Process**:
1. Aggregate all `PENDING_INVOICE` revenue entries for the month
2. Generate invoice
3. Update revenue entries with `invoiceId`
4. Set status to `INVOICED`

**Invoice**:
```json
{
  "invoiceId": "INV-2026-02-001",
  "partnerId": "{partnerId}",
  "period": "2026-01",
  "items": [
    {
      "dealId": "{dealId1}",
      "amount": 150000,
      "category": "USED_CAR_PRIVATE",
      "settledAt": "{timestamp1}"
    },
    {
      "dealId": "{dealId2}",
      "amount": 120000,
      "category": "USED_CAR_DEALER",
      "settledAt": "{timestamp2}"
    }
  ],
  "subtotal": 270000,
  "subscriptionFee": 2000000,  // If applicable
  "total": 2270000,
  "tax": 0,  // If applicable
  "currency": "KRW",
  "dueDate": "2026-02-15",  // Net-14
  "status": "PENDING_PAYMENT"
}
```

---

## Ledger Types

### Escrow Ledger Entry

**Purpose**: Track escrow funds only

**Types**:
- `HOLD`: Funds held in escrow
- `RELEASE`: Funds released from escrow
- `REFUND`: Funds refunded to buyer
- `OFFSET`: Funds offset for dispute resolution

**Schema**:
```java
EscrowLedgerEntry {
  id: UUID
  dealId: UUID
  type: LedgerEntryType  // HOLD, RELEASE, REFUND, OFFSET
  amount: BigDecimal
  currency: String
  timestamp: Instant
  reasonCode: IssueReasonCode?  // For OFFSET
  // No partnerId, no fee fields
}
```

**Key Points**:
- **No revenue fields**: Escrow Ledger has no fee or revenue fields
- **No partner reference**: Escrow Ledger does not reference partners
- **SEALED**: Escrow Ledger logic is SEALED (no changes)

---

### Revenue Ledger Entry

**Purpose**: Track platform revenue only

**Types**:
- `PLATFORM_FEE`: Per-deal platform fee
- `SUBSCRIPTION_FEE`: Monthly subscription fee

**Schema**:
```java
RevenueLedgerEntry {
  id: UUID
  dealId: UUID?  // null for subscription fees
  partnerId: UUID
  type: RevenueEntryType  // PLATFORM_FEE, SUBSCRIPTION_FEE
  amount: BigDecimal
  currency: String
  category: DealCategory?  // null for subscription fees
  feePercentage: BigDecimal?  // null for subscription fees
  totalAmount: BigDecimal?  // null for subscription fees
  timestamp: Instant
  status: RevenueEntryStatus  // PENDING_INVOICE, INVOICED, PAID, FAILED
  invoiceId: String?  // Set when invoice generated
  // No escrow account reference
}
```

**Key Points**:
- **No escrow reference**: Revenue Ledger does not reference escrow accounts
- **Separate ledger**: Revenue Ledger is completely separate from Escrow Ledger
- **Full audit trail**: Every revenue entry is logged and auditable

---

## Ledger Separation Rules

### Rule 1: No Escrow Account Reference

**Critical**: Revenue entries never reference escrow accounts

**Forbidden**:
```java
// ❌ FORBIDDEN
RevenueLedgerEntry {
  escrowAccountId: UUID  // NEVER reference escrow accounts
  escrowBalance: BigDecimal  // NEVER reference escrow balances
}
```

**Allowed**:
```java
// ✅ ALLOWED
RevenueLedgerEntry {
  dealId: UUID  // Reference deal (not escrow account)
  partnerId: UUID  // Reference partner (not escrow account)
}
```

---

### Rule 2: Separate Databases/Tables

**Architecture**: Revenue Ledger stored separately from Escrow Ledger

**Options**:
1. **Separate Tables** (same database):
   - `escrow_ledger_entries` (Escrow Ledger)
   - `revenue_ledger_entries` (Revenue Ledger)

2. **Separate Databases** (recommended for scale):
   - `escrow_db` (Escrow Ledger)
   - `revenue_db` (Revenue Ledger)

**Recommendation**: Start with separate tables, migrate to separate databases if needed

---

### Rule 3: Independent Queries

**Query Separation**: Escrow and Revenue queries are independent

**Escrow Queries**:
```sql
-- Escrow Ledger queries (no revenue fields)
SELECT * FROM escrow_ledger_entries WHERE dealId = ?
```

**Revenue Queries**:
```sql
-- Revenue Ledger queries (no escrow fields)
SELECT * FROM revenue_ledger_entries WHERE partnerId = ?
```

**No Joins**: Never join Escrow Ledger with Revenue Ledger

---

## Audit Trail

### Full Audit Trail Requirement

**Requirement**: Every revenue transaction must be auditable

**Audit Fields**:
- `id`: Unique identifier
- `timestamp`: When revenue event occurred
- `dealId`: Which deal (if applicable)
- `partnerId`: Which partner
- `amount`: Revenue amount
- `status`: Current status (PENDING_INVOICE, INVOICED, PAID, FAILED)
- `invoiceId`: Which invoice (if invoiced)

**Audit Log**:
```java
RevenueAuditLog {
  id: UUID
  revenueEntryId: UUID
  action: String  // CREATED, INVOICED, PAID, FAILED
  timestamp: Instant
  actor: String  // SYSTEM, PARTNER, ADMIN
  details: String  // JSON details
}
```

---

## Implementation Notes

### Revenue Service

**New Service**: `RevenueService` (separate from Escrow services)

**Responsibilities**:
- Calculate platform fees
- Create revenue ledger entries
- Generate invoices
- Track payment status

**No Escrow Logic**: Revenue Service does not touch Escrow Ledger

---

### Event-Driven Architecture

**Event Flow**:
1. Deal reaches SETTLED state
2. Escrow service emits `DealSettledEvent`
3. Revenue service listens to event
4. Revenue service calculates fee
5. Revenue service creates revenue ledger entry
6. Revenue service aggregates for monthly invoice

**Benefits**:
- Decoupled: Revenue service does not depend on Escrow service
- Scalable: Can process revenue events asynchronously
- Auditable: Events are logged

---

## Acceptance Criteria

### ✅ Revenue Entries Never Reference Escrow Accounts

**Test**: Revenue Ledger entries have no escrow account references

**How**:
- Revenue Ledger schema has no `escrowAccountId` field
- Revenue queries never join with Escrow Ledger
- Code review: No escrow account references in revenue code

---

### ✅ Full Audit Trail Exists

**Test**: Every revenue transaction is auditable

**How**:
- Every revenue entry has `id`, `timestamp`, `partnerId`, `amount`
- Revenue audit log tracks all changes
- Can reconstruct full revenue history

---

### ✅ Ledger Separation

**Test**: Escrow Ledger and Revenue Ledger are completely separate

**How**:
- Separate tables/databases
- No shared fields (except `dealId` for reference)
- Independent queries
- No joins between ledgers

---

## Next Steps

1. **Partner Contract Structure**: See `/docs/PARTNER_CONTRACT_STRUCTURE.md`
2. **Billing & Invoicing Plan**: See `/docs/BILLING_AND_INVOICING_PLAN.md`
3. **Partner Dashboard Spec**: See `/docs/PARTNER_DASHBOARD_SPEC.md`
