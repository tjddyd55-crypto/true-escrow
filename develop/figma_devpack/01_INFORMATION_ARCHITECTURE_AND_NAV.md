# 01 — Information Architecture & Navigation (Figma SSOT)

## Goal
Define the IA that makes the Trust Engine obvious.

## Required pages (frames)
1) App-level nav map
- Home
- Listings
- Deal (transaction)
- Admin (ops)

2) Deal-centric IA map
Deal Detail must contain 4 pillars:
- Timeline (State machine)
- Actions (role-based)
- Evidence
- Money summary (Immediate vs Holdback) + Ledger view

3) Role-based entry points
- Buyer view: approve / raise issue / upload evidence / view timers
- Seller view: mark delivered / upload evidence / view release conditions
- Admin view: dispute list / time remaining / resolve constrained

## Navigation rules
- “Deal” is first-class, not buried under listing.
- Every path that touches money must show “Money summary” panel.
- Timeline is always accessible within 1 click.

## Done criteria
- A new team member can open this file and explain the app’s structure in 2 minutes.
