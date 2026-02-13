# STEP 5 — Block Reorder + Date Policy

## Objective

Implement block reorder in the UI (drag-and-drop or up/down). Persist via existing blocks PATCH or a dedicated reorder endpoint. Enforce date rules and audit for orderIndex/sequence duplication or append bugs.

## Files to Create/Modify

| Action | Path |
|--------|------|
| Modify | `escrow-ui/app/transaction/builder/[id]/page.tsx` (reorder UI) |
| Modify or Create | `escrow-ui/app/api/engine/blocks/reorder/route.ts` (optional dedicated endpoint) or use PATCH blocks |
| Audit | `escrow-ui/lib/transaction-engine/store.ts`, any code that mutates `blocks` / `orderIndex` |

## Exact Tasks

### 1. Block reorder UI

- In builder, for each block show “Move up” / “Move down” (or drag handle). Disabled for first/last block respectively.
- On move: compute new `orderIndex` for affected blocks (swap or shift). Either:
  - Call existing `PATCH /api/engine/blocks` for each affected block with `{ id, patch: { orderIndex } }`, or
  - New `POST /api/engine/blocks/reorder` with `{ transactionId, blockIds: string[] }` (ordered); server sets `orderIndex = 1..n` by position and updates all blocks in one go.
- After success, refetch graph so UI shows new order.

### 2. Date policy enforcement

- **Block date within trade range:** Already enforced in `store.updateBlock` and `store.addBlock` (startDate/endDate must be within transaction startDate/endDate). Ensure no code path bypasses this.
- **Adding a block:** Use existing `addBlockWithAutoSplit` or `addBlock` with explicit dates. If no room (all gaps filled), show a user-friendly error: e.g. “No date range available. Extend transaction end date or split an existing block.”
- **Audit:** Search for any place that sets `orderIndex` or appends to `blocks` without going through `saveTransactionGraph` or the single addBlock path. Ensure there is no `blocks.push` or `graph.blocks.push` outside store; reorder must update existing blocks’ `orderIndex` only (replace-only semantics).

### 3. Reorder endpoint (if created)

- `POST /api/engine/blocks/reorder`: body `{ transactionId, blockIds: string[] }`. Load blocks for transaction, validate that `blockIds` equals set of block ids for that transaction (no duplicates, no missing). Set `orderIndex = 1, 2, ...` by array index. Call `store.saveTransactionGraph` with the updated graph (replace blocks array with reordered one, same ids). Return `{ ok: true, data: blocks }`.

## Verification

- Move block up/down → order changes; refresh → order persisted.
- Add blocks until no gap remains → next “Add block” shows friendly error.
- Change block dates to overlap or outside range → server returns 400 with clear message.
