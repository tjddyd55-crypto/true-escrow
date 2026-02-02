# Legal/Compliance Checklist — MN Pilot

**Purpose**: Run pilot with reduced compliance risk through operational guardrails and transparency  
**Important**: This is **non-legal advice**. Consult local legal experts for actual compliance requirements.

---

## Objective

Ensure pilot operates with:
- Clear terms and disclaimers
- Full audit trail
- Transparent processes
- Operational guardrails

---

## Checklist (Operator/Business)

### Terms & Disclaimers

- [ ] **Terms shown to users include**:
  - No pause button (deals cannot be paused)
  - Timers always visible (never hidden)
  - Dispute TTL (time limit for resolution)
  - Ledger append-only (immutable audit trail)
  - Admin constraints (no arbitrary outcomes)

- [ ] **Clear disclaimer displayed**:
  - "This is a platform process; not legal advice."
  - "Settlement outcomes are rule-based and automated."
  - "Admin operations are constrained to predefined outcomes."

**Location**: User agreement, deal creation page, dispute resolution page

---

### Evidence Policy

- [ ] **Evidence policy shown to users**:
  - Evidence required for issue creation (unless template waives)
  - Accepted evidence types (photos, videos, documents)
  - Evidence metadata stored (not files)
  - Evidence retention policy

**Location**: Issue creation page, user guide

---

### Data Handling Notice

- [ ] **Data handling notice includes**:
  - Where evidence metadata is stored
  - Retention policy (how long data is kept)
  - Data access rights
  - Data deletion process (if applicable)

**Location**: Privacy policy, data handling notice

---

### Customer Support

- [ ] **Customer support contact defined**:
  - Pilot coordinator email/phone
  - Support hours
  - Response time SLA
  - Escalation path

**Location**: Support page, footer, email signatures

---

## Payments/Escrow Handling (Operational)

### Payment Rail Configuration

- [ ] **Confirm payment rail type**:
  - [ ] Mock (test mode)
  - [ ] Real (production mode)

### If Mock

- [ ] **Label clearly in pilot environment**:
  - "PILOT MODE - TEST FUNDS ONLY"
  - "No real money is being held"
  - Displayed on all money-related pages

### If Real

- [ ] **KYC/AML considerations**:
  - Consult local experts for Mongolia (MN) requirements
  - Verify user identity (if required)
  - Report suspicious transactions (if required)
  - Comply with local regulations

**Note**: This checklist does not provide legal advice. Consult local legal experts.

---

## Incident Readiness

### Single Source of Truth

- [ ] **Timeline + Ledger as source of truth**:
  - All deal events in timeline
  - All money movements in ledger
  - Timeline reconstructs every deal
  - Ledger is append-only (immutable)

### Export Procedure

- [ ] **Export procedure documented**:
  - How to export deal timelines
  - How to export ledger entries
  - Format (JSON, CSV, etc.)
  - Retention policy

**Location**: `/docs/INCIDENT_RUNBOOK.md`

---

## Acceptance Criteria

### Pilot Materials Include Non-Guarantee Language

- [ ] User agreement includes disclaimer
- [ ] Deal creation page shows terms
- [ ] Dispute resolution page shows constraints
- [ ] All money-related pages show payment rail status

### Ops Checklist is Actionable and Reviewed

- [ ] Checklist reviewed before launch
- [ ] All items completed or documented as N/A
- [ ] Sign-off from pilot coordinator
- [ ] Legal review (if applicable)

---

## Non-Legal Advice Notice

**Important**: This checklist provides operational guidance only. It does not constitute legal advice.

**For actual compliance**:
- Consult local legal experts in Mongolia
- Review local regulations for:
  - Escrow services
  - Payment processing
  - Data protection
  - Consumer protection

**This checklist helps with**:
- Operational transparency
- User communication
- Audit readiness
- Risk mitigation

---

## Review Before Launch

### Pre-Launch Review

- [ ] All checklist items reviewed
- [ ] Terms and disclaimers finalized
- [ ] Support contact information verified
- [ ] Payment rail configuration confirmed
- [ ] Export procedure tested
- [ ] Legal review completed (if applicable)

### Sign-Off

- [ ] Pilot Coordinator: _________________ Date: _______
- [ ] Operator: _________________ Date: _______
- [ ] Engineer: _________________ Date: _______

---

## Next Steps

1. **Pilot Launch Plan**: See `/docs/PILOT_LAUNCH_PLAN.md`
2. **Incident Runbook**: See `/docs/INCIDENT_RUNBOOK.md`
3. **Go/No-Go Report**: See `/docs/GO_NO_GO_REPORT_TEMPLATE.md`
