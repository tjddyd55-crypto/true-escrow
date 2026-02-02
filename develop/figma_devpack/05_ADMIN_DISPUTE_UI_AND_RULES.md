# 05 — Admin / Dispute UI + Do-Not-Break Rules (Figma SSOT)

## Goal
Admin is an operator, not a judge. UI must enforce constraint.

## Required frames
1) Dispute list (Ops)
- Columns:
  - Deal id
  - Category
  - Status (ISSUE/DISPUTE_OPEN)
  - Time remaining (TTL)
  - Severity (derived from reason code)
- Sorting by TTL ascending (SLA-first)

2) Dispute detail (Ops)
- Full timeline (audit + key events)
- Evidence panel (links/metadata)
- Allowed resolutions (dropdown constrained)
- Confirmation modal showing:
  - selected outcome
  - resulting ledger actions summary
  - required audit reason

3) Do-Not-Break Rules (poster frame)
- No timer hiding
- No pause
- No manual settle without logs
- Dispute must have TTL
- Evidence required for issue
- Admin can only choose allowed outcomes

## Done criteria
- Admin UI cannot be used to create “hidden settlements” or “infinite freezes”.
