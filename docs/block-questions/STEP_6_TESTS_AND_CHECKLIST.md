# STEP 6 — Tests + Checklist

## Objective

Add Vitest tests for question reorder idempotency, required-question validation, and date constraints. Update the MVP 1-cycle checklist with Block Questions items.

## Files to Create/Modify

| Action | Path |
|--------|------|
| Create | `escrow-ui/lib/block-questions/__tests__/reorder-idempotency.test.ts` (or under app/api if testing API) |
| Create | `escrow-ui/lib/block-questions/__tests__/validateAnswer.test.ts` |
| Create or extend | `escrow-ui/lib/transaction-engine/__tests__/block-date-constraints.test.ts` (date rules) |
| Modify | `docs/ESCROW_MVP_1CYCLE_CHECKLIST.md` |

## Exact Tasks

### 1. Question reorder idempotency

- Test: Call reorder with the same `questionIds` order twice; after each call, GET questions and assert `order_index` is 1, 2, 3, ... No duplicate or missing indices.
- If using DB in tests, use a test DB or mock `query()`.

### 2. Required validation

- Test: `validateAnswerByType('SHORT_TEXT', '')` → `valid: false`; `validateAnswerByType('SHORT_TEXT', 'ok')` → `valid: true`. Same for LONG_TEXT, DROPDOWN (empty vs valid option), DATE (invalid vs valid ISO), NUMBER (NaN vs number).

### 3. Date constraints

- Test: In store, `updateBlock` with `startDate` before transaction `startDate` throws. Same for `endDate` after transaction `endDate`. `addBlock` with overlapping dates throws (if that’s the rule).

### 4. Update `docs/ESCROW_MVP_1CYCLE_CHECKLIST.md`

- Add a new section “Block Questions” with items:
  - [ ] Questions CRUD (GET/POST blocks/questions, PATCH/DELETE questions, reorder) return consistent shape.
  - [ ] Answers API validates required questions and type-specific rules.
  - [ ] Attachments API creates metadata row (no S3); future-proof fields present.
  - [ ] Builder: Add Question, type/label/required/options, stable keys (question.id), reorder.
  - [ ] Block reorder (up/down or drag) persists; date policy enforced; no unintended append of blocks/orderIndex.

## Verification

- `npm run test` passes (including new tests).
- Checklist items can be ticked manually after running through the flows.
