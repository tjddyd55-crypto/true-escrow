# 03 — State Components & Actions (Figma SSOT)

## Goal
Standardize how each state is presented and what actions appear.

## Required component specs (frames)
For each canonical state:
- CREATED
- FUNDED
- DELIVERED
- INSPECTION
- APPROVED
- ISSUE
- SETTLED

Create a “State Card” spec that includes:
1) Header: state name + short definition
2) Timer slot: (optional) countdown + explanation
3) Allowed actions (role-based)
4) Forbidden actions (explicit)
5) Evidence slot requirement (if applicable)

## Role-based action matrix (must include)
- Buyer:
  - INSPECTION: Approve / Raise issue
  - ISSUE: Upload evidence / View resolution timeline
- Seller:
  - FUNDED: Prepare delivery
  - DELIVERED: Upload evidence
  - APPROVED: View holdback release conditions
- System:
  - Auto-approve
  - TTL enforcement
  - Holdback release

## Done criteria
- Designers and developers can align on “which buttons exist in which state” without debate.
