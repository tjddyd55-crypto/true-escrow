# Billing & Invoicing Plan

**Purpose**: Collect revenue predictably and compliantly  
**Phase 8**: Monetization & Partner Commercialization

---

## Objective

Design a billing and invoicing system that:
- Collects revenue predictably
- Is compliant with local tax regulations
- Is independent from escrow flow
- Provides clear invoice details

---

## Core Principles

### 1. Billing Independent from Escrow Flow

**Critical**: Billing and invoicing are completely separate from escrow flow

**Separation**:
- Escrow flow: Deal lifecycle (CREATED → SETTLED)
- Billing flow: Revenue collection (monthly invoicing)
- No interaction: Billing does not affect escrow, escrow does not affect billing

---

### 2. Settlement-First Billing

**Timing**: Fees charged only after deal reaches SETTLED state

**Flow**:
1. Deal reaches SETTLED state
2. Revenue event generated (platform fee calculated)
3. Revenue ledger entry created (status: PENDING_INVOICE)
4. Monthly invoice aggregates all PENDING_INVOICE entries
5. Invoice generated and sent to partner

---

### 3. Compliance-First

**Requirement**: Billing must comply with local tax regulations

**Considerations**:
- VAT (Value Added Tax) in applicable countries
- Income tax reporting
- Invoice format requirements
- Payment method compliance

---

## Billing Cycle

### Monthly Billing (Default)

**Cycle**: Monthly, calendar month

**Timeline**:
- **Month End**: All deals settled in the month are aggregated
- **1st of Month**: Invoice generated
- **1st of Month**: Invoice sent to partner
- **15th of Month**: Payment due (Net-14)

**Example**:
- **January 2026**: Deals settled in January
- **February 1, 2026**: Invoice generated and sent
- **February 15, 2026**: Payment due

---

### Billing Period

**Definition**: Calendar month (1st to last day of month)

**Aggregation**:
- All deals settled in the billing period
- All revenue entries with status `PENDING_INVOICE`
- Subscription fees (if applicable)

---

## Invoice Generation

### Trigger

**When**: 1st of each month (automated)

**Process**:
1. System identifies all `PENDING_INVOICE` revenue entries for previous month
2. System aggregates by partner
3. System generates invoice for each partner
4. System updates revenue entries with `invoiceId`
5. System sets revenue entry status to `INVOICED`
6. System sends invoice to partner (email, dashboard)

---

### Invoice Contents

#### A. Invoice Header

**Fields**:
- Invoice number: `INV-{YYYY}-{MM}-{NNN}` (e.g., `INV-2026-02-001`)
- Invoice date: Date of generation (1st of month)
- Due date: 14 days after invoice date (Net-14)
- Partner name: Partner legal name
- Partner address: Partner billing address
- Platform name: Trust & Escrow Platform
- Platform address: Platform legal address

---

#### B. Invoice Items

**Per-Deal Fees**:
- Deal ID
- Deal category
- Deal settled date
- Deal total amount
- Fee percentage
- Platform fee amount

**Example**:
```
Item 1:
  Deal ID: DEAL-2026-01-001
  Category: USED_CAR_PRIVATE
  Settled Date: 2026-01-15
  Total Amount: ₩10,000,000
  Fee Percentage: 1.5%
  Platform Fee: ₩150,000

Item 2:
  Deal ID: DEAL-2026-01-002
  Category: USED_CAR_DEALER
  Settled Date: 2026-01-20
  Total Amount: ₩15,000,000
  Fee Percentage: 1.2%
  Platform Fee: ₩180,000
```

---

#### C. Subscription Fees (If Applicable)

**Fields**:
- Subscription tier
- Monthly fee
- Billing period

**Example**:
```
Subscription:
  Tier: Professional
  Monthly Fee: ₩2,000,000
  Billing Period: January 2026
```

---

#### D. Invoice Summary

**Fields**:
- Subtotal (per-deal fees + subscription fees)
- Tax (if applicable)
- Total amount
- Currency

**Example**:
```
Subtotal: ₩2,330,000
  Per-deal fees: ₩330,000
  Subscription: ₩2,000,000
Tax (VAT 10%): ₩233,000
Total: ₩2,563,000
Currency: KRW
```

---

### Invoice Format

**Format**: PDF (recommended)

**Requirements**:
- Professional appearance
- Clear line items
- Tax breakdown (if applicable)
- Payment instructions
- Contact information

---

## Payment Terms

### Net-14 (Default)

**Terms**: Payment due 14 days after invoice date

**Example**:
- Invoice date: February 1, 2026
- Due date: February 15, 2026

---

### Payment Methods

**Supported Methods**:
- Bank transfer (recommended)
- Credit card (if integrated)
- Wire transfer (for international partners)

**Payment Instructions**:
- Bank account details
- Reference number (invoice number)
- Payment deadline

---

## Country-Specific Considerations

### Korea (KR)

#### VAT (Value Added Tax)

**Rate**: 10% (as of 2026)

**Application**:
- Platform fees: Subject to VAT
- Subscription fees: Subject to VAT
- Total invoice: Includes VAT

**Invoice Format**:
```
Subtotal: ₩2,330,000
VAT (10%): ₩233,000
Total: ₩2,563,000
```

**Compliance**:
- VAT invoice required for Korean partners
- VAT registration number on invoice
- VAT reporting to Korean tax authorities

---

### Other Countries

**Placeholder**: Consult local tax expert

**Considerations**:
- Local tax rates
- Invoice format requirements
- Payment method compliance
- Currency conversion (if applicable)

---

## Invoice Status Tracking

### Status Flow

```
PENDING_INVOICE → INVOICED → PAID → CLOSED
                      ↓
                   OVERDUE
                      ↓
                   FAILED
```

**Statuses**:
- `PENDING_INVOICE`: Revenue entry created, not yet invoiced
- `INVOICED`: Invoice generated and sent
- `PAID`: Payment received
- `OVERDUE`: Payment past due date
- `FAILED`: Payment failed
- `CLOSED`: Invoice closed (paid or written off)

---

### Payment Tracking

**Process**:
1. Partner pays invoice
2. Payment received (bank transfer, credit card, etc.)
3. System matches payment to invoice
4. System updates invoice status to `PAID`
5. System updates revenue entry status to `PAID`

**Manual Matching**: If automatic matching fails, admin can manually match payment to invoice

---

## Billing Automation

### Automated Invoice Generation

**Schedule**: 1st of each month, 00:00 UTC

**Process**:
1. System queries all `PENDING_INVOICE` revenue entries for previous month
2. System groups by partner
3. System generates invoice for each partner
4. System updates revenue entries
5. System sends invoice (email, dashboard notification)

---

### Automated Payment Reminders

**Schedule**: 3 days before due date, 1 day after due date

**Reminders**:
- **3 days before**: "Payment due in 3 days"
- **1 day after**: "Payment overdue, please pay immediately"

---

### Automated Overdue Handling

**Process**:
1. Invoice becomes overdue (past due date)
2. System sets status to `OVERDUE`
3. System sends reminder emails
4. System may suspend partner account (if configured)
5. System may escalate to collections (if configured)

---

## Invoice Disputes

### Partner Disputes Invoice

**Process**:
1. Partner contacts support with invoice dispute
2. Support reviews invoice details
3. Support verifies revenue entries
4. Support resolves dispute (adjust invoice if needed)
5. Support updates invoice status

**Resolution**:
- If error: Adjust invoice, regenerate if needed
- If valid: Explain charges, maintain invoice

---

## Acceptance Criteria

### ✅ Billing Independent from Escrow Flow

**Test**: Billing does not affect escrow, escrow does not affect billing

**How**:
- Billing queries Revenue Ledger only (not Escrow Ledger)
- Escrow flow does not trigger billing (billing triggered by SETTLED state)
- Invoice generation does not affect deal processing

---

### ✅ Compliance

**Test**: Billing complies with local tax regulations

**How**:
- VAT included in Korean invoices (10%)
- Invoice format meets local requirements
- Tax reporting capabilities (if applicable)

---

### ✅ Predictable Revenue Collection

**Test**: Revenue collected predictably and on time

**How**:
- Monthly invoicing (1st of month)
- Clear payment terms (Net-14)
- Automated reminders
- Payment tracking

---

## Implementation Notes

### Invoice Service

**New Service**: `InvoiceService` (separate from Escrow services)

**Responsibilities**:
- Generate invoices (monthly)
- Track invoice status
- Send invoices (email, dashboard)
- Track payments
- Handle overdue invoices

**No Escrow Logic**: Invoice Service does not touch Escrow Ledger

---

### Invoice Storage

**Storage**:
- Invoice PDFs: File storage (S3, local storage)
- Invoice metadata: Database (invoice table)
- Revenue entries: Linked to invoices via `invoiceId`

---

## Next Steps

1. **Partner Dashboard Spec**: See `/docs/PARTNER_DASHBOARD_SPEC.md`
2. **Revenue Simulation**: See `/docs/REVENUE_SIMULATION.md`
3. **Go-To-Market Playbook**: See `/docs/GO_TO_MARKET_PLAYBOOK.md`
