# Revenue Simulation

**Purpose**: Model business sustainability  
**Phase 8**: Monetization & Partner Commercialization

---

## Objective

Create revenue simulations to:
- Model business sustainability
- Identify break-even points
- Plan for different growth scenarios
- Understand revenue drivers

---

## Simulation Scenarios

### Scenario 1: 100 Deals / Month

**Assumptions**:
- Average deal size: ₩10,000,000
- Fee percentage: 1.5% (USED_CAR_PRIVATE, individual sellers)
- Subscription mix: 0% (all per-deal fees)
- Dispute rate: 10%
- Ops cost per dispute: ₩50,000 (operator time)

**Calculations**:

#### A. Gross Revenue
```
Total Deal Volume: 100 deals × ₩10,000,000 = ₩1,000,000,000
Platform Fees: ₩1,000,000,000 × 0.015 = ₩15,000,000/month
Annual Revenue: ₩15,000,000 × 12 = ₩180,000,000/year
```

#### B. Ops Cost
```
Disputes: 100 deals × 0.10 = 10 disputes/month
Ops Cost: 10 disputes × ₩50,000 = ₩500,000/month
Annual Ops Cost: ₩500,000 × 12 = ₩6,000,000/year
```

#### C. Net Revenue
```
Gross Revenue: ₩15,000,000/month
Ops Cost: ₩500,000/month
Net Revenue: ₩14,500,000/month
Annual Net Revenue: ₩14,500,000 × 12 = ₩174,000,000/year
```

#### D. Margin
```
Net Margin: ₩14,500,000 / ₩15,000,000 = 96.7%
```

**Result**: Profitable but low volume. Need to scale.

---

### Scenario 2: 1,000 Deals / Month

**Assumptions**:
- Average deal size: ₩10,000,000
- Fee percentage: 1.2% (mix of USED_CAR_PRIVATE and USED_CAR_DEALER, some subscription discounts)
- Subscription mix: 30% (30% of partners have subscription, reduced fees)
- Dispute rate: 10%
- Ops cost per dispute: ₩50,000

**Calculations**:

#### A. Gross Revenue
```
Total Deal Volume: 1,000 deals × ₩10,000,000 = ₩10,000,000,000
Platform Fees (70% at 1.5%): 700 deals × ₩10,000,000 × 0.015 = ₩105,000,000
Platform Fees (30% at 1.2%): 300 deals × ₩10,000,000 × 0.012 = ₩36,000,000
Subscription Fees: 100 partners × ₩2,000,000 = ₩200,000,000
Total Platform Fees: ₩105,000,000 + ₩36,000,000 = ₩141,000,000
Total Revenue: ₩141,000,000 + ₩200,000,000 = ₩341,000,000/month
Annual Revenue: ₩341,000,000 × 12 = ₩4,092,000,000/year
```

#### B. Ops Cost
```
Disputes: 1,000 deals × 0.10 = 100 disputes/month
Ops Cost: 100 disputes × ₩50,000 = ₩5,000,000/month
Operator Staffing: 2 operators × ₩5,000,000 = ₩10,000,000/month
Total Ops Cost: ₩5,000,000 + ₩10,000,000 = ₩15,000,000/month
Annual Ops Cost: ₩15,000,000 × 12 = ₩180,000,000/year
```

#### C. Net Revenue
```
Gross Revenue: ₩341,000,000/month
Ops Cost: ₩15,000,000/month
Net Revenue: ₩326,000,000/month
Annual Net Revenue: ₩326,000,000 × 12 = ₩3,912,000,000/year
```

#### D. Margin
```
Net Margin: ₩326,000,000 / ₩341,000,000 = 95.6%
```

**Result**: Profitable and scalable. Good growth trajectory.

---

### Scenario 3: 10,000 Deals / Month

**Assumptions**:
- Average deal size: ₩10,000,000
- Fee percentage: 1.0% (mix of categories, more subscription discounts)
- Subscription mix: 50% (50% of partners have subscription)
- Dispute rate: 8% (improved with scale)
- Ops cost per dispute: ₩40,000 (efficiency gains)

**Calculations**:

#### A. Gross Revenue
```
Total Deal Volume: 10,000 deals × ₩10,000,000 = ₩100,000,000,000
Platform Fees (50% at 1.5%): 5,000 deals × ₩10,000,000 × 0.015 = ₩750,000,000
Platform Fees (50% at 1.0%): 5,000 deals × ₩10,000,000 × 0.010 = ₩500,000,000
Subscription Fees: 500 partners × ₩2,000,000 = ₩1,000,000,000
Total Platform Fees: ₩750,000,000 + ₩500,000,000 = ₩1,250,000,000
Total Revenue: ₩1,250,000,000 + ₩1,000,000,000 = ₩2,250,000,000/month
Annual Revenue: ₩2,250,000,000 × 12 = ₩27,000,000,000/year
```

#### B. Ops Cost
```
Disputes: 10,000 deals × 0.08 = 800 disputes/month
Ops Cost: 800 disputes × ₩40,000 = ₩32,000,000/month
Operator Staffing: 5 operators × ₩5,000,000 = ₩25,000,000/month
Infrastructure: ₩10,000,000/month (scaling costs)
Total Ops Cost: ₩32,000,000 + ₩25,000,000 + ₩10,000,000 = ₩67,000,000/month
Annual Ops Cost: ₩67,000,000 × 12 = ₩804,000,000/year
```

#### C. Net Revenue
```
Gross Revenue: ₩2,250,000,000/month
Ops Cost: ₩67,000,000/month
Net Revenue: ₩2,183,000,000/month
Annual Net Revenue: ₩2,183,000,000 × 12 = ₩26,196,000,000/year
```

#### D. Margin
```
Net Margin: ₩2,183,000,000 / ₩2,250,000,000 = 97.0%
```

**Result**: Highly profitable at scale. Strong business model.

---

## Variables

### 1. Average Deal Size

**Impact**: Directly affects revenue

**Ranges**:
- Used Car: ₩5,000,000 - ₩30,000,000
- Real Estate: ₩50,000,000 - ₩500,000,000

**Sensitivity**:
- 10% increase in deal size → 10% increase in revenue (if fee % constant)

---

### 2. Fee Percentage

**Impact**: Directly affects revenue

**Ranges**:
- USED_CAR_PRIVATE: 1.5%
- USED_CAR_DEALER: 1.2%
- REAL_ESTATE_SALE: 0.5%

**Sensitivity**:
- 0.1% increase in fee → 6.7% increase in revenue (at 1.5% base)

---

### 3. Subscription Mix

**Impact**: Affects revenue mix (subscription vs per-deal)

**Ranges**:
- 0% (all per-deal)
- 30% (some subscription)
- 50% (balanced)
- 100% (all subscription)

**Sensitivity**:
- Higher subscription mix → More predictable revenue, lower per-deal fees

---

### 4. Ops Cost per Dispute

**Impact**: Affects net margin

**Ranges**:
- ₩30,000 - ₩100,000 per dispute

**Factors**:
- Operator efficiency
- Dispute complexity
- Automation level

**Sensitivity**:
- 10% reduction in ops cost → 0.3% increase in margin (at 10% dispute rate)

---

### 5. Dispute Rate

**Impact**: Affects ops cost

**Ranges**:
- 5% (excellent)
- 10% (good)
- 15% (needs improvement)
- 20%+ (problematic)

**Sensitivity**:
- 1% reduction in dispute rate → 10% reduction in ops cost (at 100 disputes/month)

---

## Break-Even Analysis

### Fixed Costs

**Monthly Fixed Costs**:
- Infrastructure: ₩5,000,000
- Operator Staffing (minimum): ₩5,000,000
- Admin/Support: ₩3,000,000
- **Total Fixed**: ₩13,000,000/month

---

### Variable Costs

**Per-Deal Variable Costs**:
- Ops cost per dispute: ₩50,000
- Dispute rate: 10%
- Variable cost per deal: ₩50,000 × 0.10 = ₩5,000/deal

---

### Break-Even Calculation

**Formula**:
```
Break-even deals = Fixed Costs / (Revenue per Deal - Variable Cost per Deal)
```

**Assumptions**:
- Average deal size: ₩10,000,000
- Fee percentage: 1.5%
- Revenue per deal: ₩10,000,000 × 0.015 = ₩150,000
- Variable cost per deal: ₩5,000

**Calculation**:
```
Break-even deals = ₩13,000,000 / (₩150,000 - ₩5,000)
                 = ₩13,000,000 / ₩145,000
                 = 90 deals/month
```

**Result**: Need 90 deals/month to break even (at 1.5% fee, 10% dispute rate)

---

## Revenue Drivers

### 1. Deal Volume

**Impact**: Directly proportional to revenue

**Growth Strategy**:
- Acquire more partners
- Expand to new categories
- Expand to new countries

---

### 2. Average Deal Size

**Impact**: Directly proportional to revenue

**Growth Strategy**:
- Focus on higher-value categories (real estate)
- Attract larger deals
- Premium services for high-value deals

---

### 3. Fee Percentage

**Impact**: Directly proportional to revenue

**Growth Strategy**:
- Optimize pricing by category
- Subscription tiers (higher fees for non-subscribers)
- Volume discounts (lower fees for high volume)

---

### 4. Subscription Mix

**Impact**: Predictable revenue base

**Growth Strategy**:
- Convert per-deal partners to subscription
- Offer subscription incentives
- Tiered subscription pricing

---

### 5. Dispute Rate

**Impact**: Affects ops cost (negative)

**Reduction Strategy**:
- Improve evidence requirements
- Better user education
- Automated dispute resolution (if possible)

---

## Output Summary

### Scenario Comparison

| Scenario | Deals/Month | Gross Revenue/Month | Ops Cost/Month | Net Revenue/Month | Margin |
|----------|-------------|---------------------|----------------|-------------------|--------|
| 100 | 100 | ₩15,000,000 | ₩500,000 | ₩14,500,000 | 96.7% |
| 1,000 | 1,000 | ₩341,000,000 | ₩15,000,000 | ₩326,000,000 | 95.6% |
| 10,000 | 10,000 | ₩2,250,000,000 | ₩67,000,000 | ₩2,183,000,000 | 97.0% |

---

### Key Insights

1. **Break-Even**: ~90 deals/month (at 1.5% fee, 10% dispute rate)
2. **Scalability**: High margins (95%+) at all scales
3. **Growth Drivers**: Deal volume, average deal size, fee percentage
4. **Cost Drivers**: Dispute rate, ops efficiency

---

## Acceptance Criteria

### ✅ Clear Break-Even Analysis

**Test**: Break-even point clearly identified

**How**:
- Fixed costs calculated
- Variable costs calculated
- Break-even deals calculated
- Sensitivity analysis provided

---

### ✅ Multiple Scenarios

**Test**: Different growth scenarios modeled

**How**:
- 100 deals/month scenario
- 1,000 deals/month scenario
- 10,000 deals/month scenario
- Each scenario includes revenue, costs, margin

---

### ✅ Revenue Drivers Identified

**Test**: Key revenue drivers identified and analyzed

**How**:
- Deal volume, average deal size, fee percentage analyzed
- Subscription mix, dispute rate analyzed
- Growth strategies provided

---

## Next Steps

1. **Go-To-Market Playbook**: See `/docs/GO_TO_MARKET_PLAYBOOK.md`
2. **Pricing Model**: See `/docs/PRICING_MODEL.md` (for fee optimization)
