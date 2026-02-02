# 02 — Transaction Timeline UI (Figma SSOT)

## Goal
Make the state machine + timers understandable at a glance.

## Required frames
1) Timeline — Default (happy path)
- Horizontal or vertical timeline:
  CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
- Each node shows:
  - State name
  - Short meaning line
  - Timer (if running)
  - Who acts (buyer/seller/system)

2) Timeline — With ISSUE overlay
- Same timeline, but ISSUE appears as overlay layer
- Overlay shows:
  - Reason code
  - Evidence required indicator
  - Dispute TTL countdown
  - Allowed outcomes (from rules) at high level

3) Timeline — Auto-approve visualization
- INSPECTION timer reaches zero triggers APPROVED (system)
- Emphasize “buyer no response → auto approve”

## UI rules (must)
- Timers always visible when active:
  - Auto-approve timer (INSPECTION)
  - Dispute TTL (ISSUE/DISPUTE_OPEN)
  - Holdback release timer/condition (APPROVED)
- No “pause” affordance.
- No “manual settle” in buyer/seller views.

## Done criteria
- This file alone can teach what makes the platform different from normal marketplaces.
