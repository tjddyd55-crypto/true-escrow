# STEP 3 — API: Answers + Attachments

## Objective

Implement answers submission with required-question validation, and attachment metadata creation (no S3 upload yet). Add validation helpers for question types.

## Files to Create/Modify

| Action | Path |
|--------|------|
| Create | `escrow-ui/app/api/engine/trades/[tradeId]/blocks/[blockId]/answers/route.ts` |
| Create | `escrow-ui/app/api/engine/trades/[tradeId]/blocks/[blockId]/attachments/route.ts` |
| Create | `escrow-ui/lib/block-questions/validateAnswer.ts` (validation utilities) |

## Exact Tasks

### 1. POST `/api/engine/trades/[tradeId]/blocks/[blockId]/answers`

- Body: `{ actorRole: string, answers: [{ questionId: string, answer: any }] }`.
- Load all questions for `block_id` from `escrow_block_questions` where `required = true`. For each required question, ensure at least one entry in `answers` with that `questionId` and non-empty value (after type-specific validation).
- Validation: use shared helpers (see below) — SHORT_TEXT/LONG_TEXT: string non-empty; CHECKBOX: array; DROPDOWN: string in options; DATE: ISO date string; FILE: placeholder (e.g. attachment id or skip); NUMBER: number or string that parses to number.
- Insert/upsert into `escrow_block_answers`: one row per `questionId` with `trade_id`, `block_id`, `question_id`, `actor_role`, `answer` (jsonb), `created_at`. Upsert key: e.g. `(trade_id, block_id, question_id, actor_role)` if you add a unique constraint.
- Return `{ ok: true, data: { saved: number } }`. On validation failure return `{ ok: false, error: "Required question ... not answered" }` (400).

### 2. POST `/api/engine/trades/[tradeId]/blocks/[blockId]/attachments`

- Body: `{ uploaderRole, questionId? (optional), file_name, mime, size, storage_provider?, object_key? }`. Create a row in `escrow_block_attachments` with `status = 'PENDING'`. No file upload to S3/R2 in this step; future-proof fields present.
- Return `{ ok: true, data: { id, ... } }`.

### 3. Validation utilities (`lib/block-questions/validateAnswer.ts`)

- Export: `validateAnswerByType(questionType: string, value: unknown, options?: string[]): { valid: boolean; error?: string }`.
- Implement for: SHORT_TEXT, LONG_TEXT (string); CHECKBOX (array of strings); DROPDOWN (string in options); DATE (YYYY-MM-DD); FILE (accept placeholder or skip); NUMBER (number or numeric string).
- Use in answers route before persisting.

## Verification

- **Answers:** `curl -X POST .../api/engine/trades/<tradeId>/blocks/<blockId>/answers -H "Content-Type: application/json" -d '{"actorRole":"BUYER","answers":[{"questionId":"...","answer":"John"}]}'`. With a required question missing → 400 and error message.
- **Attachments:** `curl -X POST .../api/engine/trades/<tradeId>/blocks/<blockId>/attachments -H "Content-Type: application/json" -d '{"uploaderRole":"SELLER","file_name":"doc.pdf","mime":"application/pdf","size":1024}'` → `{ "ok": true, "data": { "id": "..." } }`.
