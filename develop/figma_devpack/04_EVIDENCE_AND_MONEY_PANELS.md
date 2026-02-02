# 04 — Evidence + Money Panels (Figma SSOT)

## Goal
Make evidence and money flow transparent and trustable.

## Required frames
1) Evidence Panel (buyer/seller)
- Evidence slots:
  - photo/video/report
- Upload CTA
- Evidence requirement banner (ISSUE requires evidence)
- Evidence list with timestamps and uploader

2) Money Summary Panel
- Total amount
- Immediate amount
- Holdback amount
- Release condition summary (rule-based)
- Next scheduled action (e.g., “Holdback releases when APPROVED or auto-approve”)

3) Ledger View (read-only)
- Append-only entries list:
  HOLD / RELEASE / REFUND / OFFSET
- Show reference id (audit link)
- Timestamp

## UI rules (must)
- Never imply “full freeze” unless template explicitly says so (default: do not show).
- Money panel must avoid legal promises; it describes rule outcomes and conditions.

## Done criteria
- A user can see where money is and what must happen next.
