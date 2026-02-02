# Partner Contract Structure

**Purpose**: Standardize contracts with dealers, agencies, and marketplaces  
**Phase 8**: Monetization & Partner Commercialization

---

## Objective

Create standardized contract structures that:
- Map cleanly to system behavior
- Protect platform from legal liability
- Set clear expectations for partners
- Define SLAs for operations (not outcomes)

---

## Core Principles

### 1. Platform is NOT a Legal Arbitrator

**Critical Clause**: Platform provides escrow services based on published rules, not legal judgment.

**Language**:
> "The Platform provides escrow services based on automated rules and published policies. The Platform is not a legal arbitrator, judge, or dispute resolution service. Settlement outcomes are determined by rule-based processes, not legal decisions."

---

### 2. Settlement Follows Published Rules

**Clause**: All settlements follow published rules, not manual decisions.

**Language**:
> "All settlement outcomes are determined by published rules and automated processes. The Platform does not guarantee specific settlement outcomes. Partners agree to accept rule-based settlement results."

---

### 3. No Manual Settlement Guarantee

**Clause**: Platform does not guarantee manual settlement or override of rules.

**Language**:
> "The Platform does not provide manual settlement services or override automated rules. Admin actions are limited to rule-allowed outcomes only. Partners agree that settlement is rule-based, not discretionary."

---

### 4. SLA Defined for Ops Response, Not Outcomes

**Clause**: SLA covers operational response time, not settlement outcomes.

**Language**:
> "Service Level Agreements (SLAs) cover operational response times (e.g., dispute review within 24 hours), not settlement outcomes. The Platform does not guarantee specific settlement results or dispute resolutions."

---

## Contract Types

### 1. Marketplace Partner

**Definition**: Large marketplace/platform integrating escrow service

**Examples**:
- E-commerce platforms
- Classified ad platforms
- Cross-border trading platforms

**Contract Structure**:
- **Partner Agreement**: Main contract
- **Pricing Appendix**: Volume-based pricing
- **SLA Appendix**: API uptime, response times
- **Integration Appendix**: API documentation, webhooks

**Key Clauses**:
- API integration requirements
- Volume commitments
- Data sharing agreements
- Branding requirements

---

### 2. Dealer / Agency Partner

**Definition**: Individual dealers or agencies using escrow service

**Examples**:
- Used car dealers
- Real estate agencies
- Service providers

**Contract Structure**:
- **Partner Agreement**: Main contract
- **Pricing Appendix**: Subscription tiers, per-deal fees
- **SLA Appendix**: Dispute response times, support hours

**Key Clauses**:
- Subscription tier selection
- Deal volume expectations
- Evidence requirements
- Dispute resolution process

---

### 3. Enterprise / Platform API Partner

**Definition**: Large enterprises or platforms with custom integration

**Examples**:
- Enterprise marketplaces
- Financial institutions
- Government platforms

**Contract Structure**:
- **Enterprise Agreement**: Custom contract
- **Pricing Appendix**: Custom pricing (negotiated)
- **SLA Appendix**: Custom SLAs (uptime, response times)
- **Integration Appendix**: Custom API integration
- **Data Processing Agreement**: GDPR/compliance requirements

**Key Clauses**:
- Custom pricing terms
- Volume commitments
- Data processing agreements
- Compliance requirements

---

## Required Documents

### 1. Partner Agreement (Main Contract)

**Purpose**: Define relationship, responsibilities, and legal terms

**Sections**:

#### A. Definitions
- **Platform**: Trust & Escrow platform
- **Partner**: Dealer, agency, marketplace, or enterprise
- **Deal**: Individual escrow transaction
- **Settlement**: Rule-based outcome of deal
- **Dispute**: Issue raised during deal lifecycle

#### B. Services Provided
- Escrow service (fund holding and release)
- Rule-based settlement
- Dispute resolution (rule-constrained)
- Partner dashboard access
- API access (if applicable)

#### C. Platform Responsibilities
- Maintain escrow service availability
- Process deals according to published rules
- Provide operational support (within SLA)
- Maintain audit trail
- Protect partner data

#### D. Partner Responsibilities
- Provide accurate deal information
- Upload required evidence
- Respond to disputes within TTL
- Pay platform fees (per pricing appendix)
- Comply with terms of service

#### E. Settlement Process
- **Rule-Based**: All settlements follow published rules
- **No Manual Override**: Platform does not provide manual settlement
- **Admin Constraints**: Admin actions limited to rule-allowed outcomes
- **No Guarantees**: Platform does not guarantee specific outcomes

#### F. Dispute Resolution
- **Rule-Based**: Disputes resolved according to published rules
- **TTL-Based**: Disputes auto-resolve if not resolved within TTL
- **Admin Constraints**: Admin cannot override rules
- **No Legal Arbitration**: Platform is not a legal arbitrator

#### G. Fees and Payment
- Platform fees (per pricing appendix)
- Subscription fees (if applicable)
- Payment terms: Net-14
- Invoicing: Monthly

#### H. Limitation of Liability
- **No Outcome Guarantees**: Platform does not guarantee settlement outcomes
- **Rule-Based Only**: Platform provides rule-based services only
- **No Legal Advice**: Platform does not provide legal advice
- **Maximum Liability**: Limited to fees paid in last 12 months

#### I. Termination
- Either party may terminate with 30 days notice
- Active deals complete normally
- Fees due until termination date

---

### 2. Pricing Appendix

**Purpose**: Define pricing structure and fees

**Sections**:

#### A. Pricing Model
- Per-deal fees (percentage of deal amount)
- Subscription fees (if applicable)
- Hybrid model (subscription + per-deal)

#### B. Fee Rates
- By category (USED_CAR_PRIVATE, USED_CAR_DEALER, REAL_ESTATE_SALE, etc.)
- By partner tier (Starter, Professional, Enterprise)
- Volume discounts (if applicable)

#### C. Payment Terms
- Billing cycle: Monthly
- Payment terms: Net-14
- Currency: KRW (or as specified)
- Taxes: As applicable

#### D. Fee Calculation
- Fees charged after SETTLED state
- Fees never deducted from escrow principal
- Fees logged separately in Revenue Ledger

---

### 3. SLA Appendix

**Purpose**: Define service level agreements for operations

**Sections**:

#### A. Uptime SLA (API Partners)
- **Target**: 99.5% uptime
- **Measurement**: Monthly
- **Exclusions**: Scheduled maintenance, force majeure

#### B. Response Time SLA (All Partners)
- **Dispute Review**: Within 24 hours (business days)
- **Support Response**: Within 2 hours (business hours)
- **Escalation**: Within 30 minutes (SEV0/SEV1)

#### C. Settlement SLA (NOT Outcome SLA)
- **Important**: SLA covers process, not outcomes
- **Deal Processing**: Deals processed according to published rules
- **No Outcome Guarantee**: Platform does not guarantee specific settlement results

#### D. Dispute Resolution SLA
- **Review Time**: Within 24 hours (business days)
- **Resolution Time**: Within TTL (48-72 hours, depending on category)
- **No Outcome Guarantee**: Platform does not guarantee specific dispute resolutions

---

## Key Contract Clauses

### Clause 1: Rule-Based Settlement

**Language**:
> "All settlement outcomes are determined by published rules and automated processes. The Platform does not provide manual settlement services or override automated rules. Partners agree to accept rule-based settlement results."

**Purpose**: Protect platform from liability, set clear expectations

---

### Clause 2: No Legal Arbitration

**Language**:
> "The Platform provides escrow services based on automated rules and published policies. The Platform is not a legal arbitrator, judge, or dispute resolution service. Settlement outcomes are determined by rule-based processes, not legal decisions."

**Purpose**: Clarify platform role, avoid legal liability

---

### Clause 3: Admin Constraints

**Language**:
> "Admin actions are limited to rule-allowed outcomes only. The Platform does not provide discretionary settlement services. Partners agree that admin actions are rule-constrained and auditable."

**Purpose**: Align contract with system behavior (admin constraints)

---

### Clause 4: SLA for Operations, Not Outcomes

**Language**:
> "Service Level Agreements (SLAs) cover operational response times (e.g., dispute review within 24 hours), not settlement outcomes. The Platform does not guarantee specific settlement results or dispute resolutions."

**Purpose**: Set realistic expectations, avoid outcome guarantees

---

### Clause 5: Revenue Separation

**Language**:
> "Platform fees are charged separately from escrow funds. Fees are never deducted from escrow principal. Fees are logged separately in Revenue Ledger and invoiced monthly."

**Purpose**: Clarify fee structure, ensure revenue separation

---

## Contract Mapping to System Behavior

### System Behavior → Contract Language

| System Behavior | Contract Language |
|----------------|-------------------|
| Rule-based settlement | "Settlement follows published rules" |
| Admin constraints | "Admin actions limited to rule-allowed outcomes" |
| No manual settlement | "Platform does not provide manual settlement services" |
| TTL-based auto-resolution | "Disputes auto-resolve if not resolved within TTL" |
| Revenue separation | "Fees charged separately from escrow funds" |
| Audit trail | "All actions are logged and auditable" |

---

## Acceptance Criteria

### ✅ Contract Maps Cleanly to System Behavior

**Test**: Contract language accurately reflects system behavior

**How**:
- Contract clauses match system constraints (admin constraints, rule-based settlement)
- No promises that system cannot deliver (no manual settlement, no outcome guarantees)
- SLA covers operations, not outcomes

---

### ✅ Legal Protection

**Test**: Contract protects platform from legal liability

**How**:
- Clear limitation of liability clauses
- No outcome guarantees
- Platform is not a legal arbitrator
- Rule-based settlement clearly stated

---

### ✅ Clear Expectations

**Test**: Partners understand what platform provides

**How**:
- Clear service descriptions
- Rule-based settlement explained
- Admin constraints explained
- SLA covers operations, not outcomes

---

## Implementation Notes

### Contract Templates

**Templates**:
- `PARTNER_AGREEMENT_TEMPLATE.md`: Main contract template
- `PRICING_APPENDIX_TEMPLATE.md`: Pricing appendix template
- `SLA_APPENDIX_TEMPLATE.md`: SLA appendix template

**Customization**:
- Fill in partner-specific details (name, address, etc.)
- Select pricing tier
- Customize SLAs (if applicable)

---

### Contract Generation

**Process**:
1. Partner selects contract type (Marketplace, Dealer/Agency, Enterprise)
2. System generates contract from template
3. Partner reviews and signs
4. Contract stored in partner profile
5. Contract terms applied to partner account

**Automation**: Contract generation can be automated, but legal review recommended

---

## Next Steps

1. **Billing & Invoicing Plan**: See `/docs/BILLING_AND_INVOICING_PLAN.md`
2. **Partner Dashboard Spec**: See `/docs/PARTNER_DASHBOARD_SPEC.md`
3. **Go-To-Market Playbook**: See `/docs/GO_TO_MARKET_PLAYBOOK.md`
