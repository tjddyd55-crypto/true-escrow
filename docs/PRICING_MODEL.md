# Pricing Model

**Purpose**: Define how the platform charges money in a scalable, fair way  
**Phase 8**: Monetization & Partner Commercialization

---

## Objective

Establish a pricing model that:
- Is scalable and fair
- Does not interfere with escrow core logic
- Keeps revenue flows completely separate from escrow funds
- Is understandable in < 2 minutes
- Provides no incentive to delay settlement

---

## Core Principles

### 1. Revenue Separation

**Critical Rule**: Revenue flows must NEVER mix with escrow funds.

- Fees are charged AFTER settlement (SETTLED state)
- Fees NEVER deducted from escrow principal
- Fees logged separately in Revenue Ledger
- Escrow Ledger ≠ Revenue Ledger

### 2. Settlement-First

**Timing**: Fees are charged only after deal reaches SETTLED state.

- No fees on CREATED, FUNDED, DELIVERED, INSPECTION, APPROVED
- No fees on ISSUE (dispute) state
- Fees calculated and invoiced only after SETTLED

### 3. Auditability

**Requirement**: All fees must be ledger-safe and auditable.

- Every fee transaction logged in Revenue Ledger
- Full audit trail exists
- Revenue entries never reference escrow accounts

---

## Supported Pricing Models

### Model A: Per-Deal Fee (Transaction-Based)

**Structure**: Percentage of total deal amount

**Formula**:
```
platform_fee = totalAmount × feePercentage
```

**Category-Based Rates**:

| Category | Fee Percentage | Example (₩10,000,000 deal) |
|----------|---------------|----------------------------|
| USED_CAR_PRIVATE | 1.5% | ₩150,000 |
| USED_CAR_DEALER | 1.2% | ₩120,000 |
| REAL_ESTATE_SALE | 0.5% | ₩50,000 |
| REAL_ESTATE_RENTAL | 0.8% | ₩80,000 |

**Pros**:
- Simple to understand
- Scales with deal volume
- No upfront commitment required

**Cons**:
- Revenue varies with deal volume
- May discourage high-value deals

**Use Case**: Individual sellers, small dealers, one-off transactions

---

### Model B: Subscription (B2B)

**Structure**: Monthly flat fee for dealers/agencies

**Tiers**:

| Tier | Monthly Fee | Deal Limit | Per-Deal Fee |
|------|------------|------------|--------------|
| Starter | ₩500,000 | 10 deals | 1.5% |
| Professional | ₩2,000,000 | 50 deals | 1.2% |
| Enterprise | ₩5,000,000 | Unlimited | 1.0% |

**Pros**:
- Predictable revenue
- Encourages high-volume partners
- Lower per-deal fees for subscribers

**Cons**:
- Requires upfront commitment
- May not suit low-volume partners

**Use Case**: Dealers, agencies, marketplaces with consistent volume

---

### Model C: Hybrid (Recommended)

**Structure**: Subscription + reduced per-deal fee

**Formula**:
```
monthly_revenue = subscription_fee + (deals × reduced_per_deal_fee)
```

**Example**:
- Professional tier: ₩2,000,000/month + 1.2% per deal
- If 30 deals/month at ₩10,000,000 average:
  - Subscription: ₩2,000,000
  - Per-deal fees: 30 × ₩120,000 = ₩3,600,000
  - Total: ₩5,600,000/month

**Pros**:
- Predictable base revenue (subscription)
- Scales with volume (per-deal fees)
- Incentivizes high-volume partners
- Flexible for different partner sizes

**Cons**:
- More complex to explain
- Requires tier management

**Use Case**: **Recommended for most partners** (dealers, agencies, marketplaces)

---

## Pricing by Partner Type

### 1. Individual Sellers (C2C)

**Model**: Per-Deal Fee only

**Rate**: 1.5% of total amount

**Example**:
- Deal: ₩10,000,000
- Fee: ₩150,000
- Charged after SETTLED

**No subscription required**

---

### 2. Dealers / Agencies (B2C)

**Model**: Hybrid (Subscription + Per-Deal)

**Tiers**:
- **Starter**: ₩500,000/month + 1.5% per deal (up to 10 deals)
- **Professional**: ₩2,000,000/month + 1.2% per deal (up to 50 deals)
- **Enterprise**: ₩5,000,000/month + 1.0% per deal (unlimited)

**Example** (Professional tier, 30 deals/month):
- Subscription: ₩2,000,000
- Per-deal fees: 30 × ₩120,000 = ₩3,600,000
- Total: ₩5,600,000/month

---

### 3. Marketplaces / Platforms (B2B2C)

**Model**: Hybrid (Custom Enterprise)

**Structure**: Custom pricing based on volume commitment

**Example**:
- Base subscription: ₩10,000,000/month
- Per-deal fee: 0.8% (reduced for high volume)
- Volume commitment: 100+ deals/month

**Negotiable**: Based on expected volume and strategic value

---

## Fee Calculation Rules

### Rule 1: Settlement-First

**Timing**: Fees calculated only after SETTLED state

```
Deal Lifecycle:
CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
                                                              ↑
                                                      Fee calculated here
```

**No fees on**:
- CREATED, FUNDED, DELIVERED, INSPECTION, APPROVED states
- ISSUE (dispute) state
- Cancelled deals (never reach SETTLED)

---

### Rule 2: Fee Calculation

**Formula**:
```
platform_fee = totalAmount × feePercentage
```

**Where**:
- `totalAmount`: Deal total amount (from deal creation)
- `feePercentage`: Based on category and partner tier

**Example**:
- Deal: ₩10,000,000
- Category: USED_CAR_PRIVATE
- Partner: Individual (no subscription)
- Fee: ₩10,000,000 × 0.015 = ₩150,000

---

### Rule 3: Subscription Discount

**If partner has active subscription**:
- Use reduced per-deal fee from tier
- Subscription fee charged monthly (separate from per-deal fees)

**Example**:
- Partner: Professional tier (1.2% per deal)
- Deal: ₩10,000,000
- Fee: ₩10,000,000 × 0.012 = ₩120,000 (reduced from 1.5%)

---

## Constraints

### 1. No Escrow Principal Deduction

**Critical**: Fees NEVER deducted from escrow principal

**Escrow Flow**:
```
Buyer deposits: ₩10,000,000
→ Escrow holds: ₩10,000,000 (full amount)
→ Seller receives: ₩10,000,000 (full amount)
→ Platform fee: ₩150,000 (charged separately, not from escrow)
```

**Revenue Flow** (separate):
```
Platform fee: ₩150,000
→ Charged to partner/seller (separate payment)
→ Logged in Revenue Ledger
→ Invoiced monthly
```

---

### 2. Fees Logged Separately

**Ledger Separation**:
- **Escrow Ledger**: HOLD, RELEASE, REFUND, OFFSET (escrow funds only)
- **Revenue Ledger**: PLATFORM_FEE, SUBSCRIPTION_FEE (revenue only)

**No mixing**: Revenue entries never reference escrow accounts

---

### 3. No Settlement Delay Incentive

**Design**: Pricing model does not incentivize delaying settlement

**Mechanisms**:
- Fees charged after SETTLED (not before)
- No time-based fees (no daily/monthly charges on active deals)
- No penalty for fast settlement

**Result**: Partners want fast settlement (better user experience, faster cash flow)

---

## Pricing Transparency

### Partner Dashboard

**Visible Metrics**:
- Number of deals
- Total settled volume
- Platform fees incurred
- Average fee per deal
- Subscription status (if applicable)

**Not Visible**:
- Escrow internals (ledger entries, dispute details)
- Other partners' data
- Admin actions

---

### Invoice Details

**Monthly Invoice Includes**:
- Number of deals settled
- Total settled volume
- Platform fees (per-deal fees)
- Subscription fees (if applicable)
- Taxes (if applicable)
- Payment terms (Net-14)

---

## Acceptance Criteria

### ✅ Pricing Understandable in < 2 Minutes

**Test**: Partner can understand pricing in < 2 minutes

**How**:
- Clear pricing table
- Simple formula: `fee = amount × percentage`
- Examples provided
- FAQ section

---

### ✅ No Incentive to Delay Settlement

**Test**: Pricing model does not incentivize delaying settlement

**How**:
- Fees charged after SETTLED (not before)
- No time-based fees
- No penalty for fast settlement
- Fast settlement = better user experience = more deals

---

### ✅ Revenue Separation

**Test**: Revenue flows never mix with escrow funds

**How**:
- Fees charged separately (not from escrow)
- Revenue Ledger separate from Escrow Ledger
- Full audit trail exists
- Revenue entries never reference escrow accounts

---

## Implementation Notes

### Configuration

**Pricing Rules** (configurable, not hardcoded):

```yaml
pricing:
  per-deal-fees:
    USED_CAR_PRIVATE: 0.015  # 1.5%
    USED_CAR_DEALER: 0.012   # 1.2%
    REAL_ESTATE_SALE: 0.005  # 0.5%
    REAL_ESTATE_RENTAL: 0.008 # 0.8%
  
  subscription-tiers:
    starter:
      monthly-fee: 500000
      deal-limit: 10
      per-deal-fee: 0.015
    professional:
      monthly-fee: 2000000
      deal-limit: 50
      per-deal-fee: 0.012
    enterprise:
      monthly-fee: 5000000
      deal-limit: unlimited
      per-deal-fee: 0.010
```

**No code changes**: Pricing rules are configuration, not logic

---

## Next Steps

1. **Fee Flow & Ledger Mapping**: See `/docs/FEE_FLOW_AND_LEDGER_MAPPING.md`
2. **Partner Contract Structure**: See `/docs/PARTNER_CONTRACT_STRUCTURE.md`
3. **Billing & Invoicing Plan**: See `/docs/BILLING_AND_INVOICING_PLAN.md`
