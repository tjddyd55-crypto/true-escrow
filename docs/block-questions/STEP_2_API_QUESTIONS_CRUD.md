# STEP 2 — API: Questions CRUD

## Objective

Implement Next.js App Router APIs for block questions using `lib/db.ts` (pg Pool). Responses must be consistent: `{ ok: true, data: ... }` or `{ ok: false, error: "..." }`.

## Files to Create/Modify

| Action | Path |
|--------|------|
| Create | `escrow-ui/app/api/engine/blocks/[blockId]/questions/route.ts` |
| Create | `escrow-ui/app/api/engine/questions/[questionId]/route.ts` |
| Create | `escrow-ui/app/api/engine/questions/reorder/route.ts` |

## Exact Tasks

### 1. GET/POST `/api/engine/blocks/[blockId]/questions`

- **GET:** Query `escrow_block_questions` where `block_id = $1` ordered by `order_index`. Return `{ ok: true, data: rows }`. Use `query()` from `lib/db.ts`.
- **POST:** Body: `{ type?, label?, description?, required?, options? }`. Insert into `escrow_block_questions` with `block_id`, `order_index = (SELECT COALESCE(MAX(order_index),0)+1 FROM escrow_block_questions WHERE block_id = $1)`. Return `{ ok: true, data: insertedRow }`.

### 2. PATCH/DELETE `/api/engine/questions/[questionId]`

- **PATCH:** Body: partial `{ type, label, description, required, options }`. Update `escrow_block_questions` where `id = $1`. Return `{ ok: true, data: updatedRow }`.
- **DELETE:** Delete from `escrow_block_questions` where `id = $1`. Return `{ ok: true }`.

### 3. POST `/api/engine/questions/reorder`

- Body: `{ blockId: string, questionIds: string[] }` (ordered array of question ids).
- Server: for each id in order, set `order_index = 1, 2, 3, ...` in a single transaction (update in loop or bulk UPDATE with CASE/unnest). Return `{ ok: true, data: { blockId, orderIndexByQuestionId } }`.

## Verification

- **GET:** `curl -s http://localhost:3000/api/engine/blocks/<blockId>/questions` → `{ "ok": true, "data": [] }` or list.
- **POST question:** `curl -X POST .../api/engine/blocks/<blockId>/questions -H "Content-Type: application/json" -d '{"type":"SHORT_TEXT","label":"Name","required":true}'` → `{ "ok": true, "data": { "id": "...", ... } }`.
- **PATCH:** `curl -X PATCH .../api/engine/questions/<questionId> -H "Content-Type: application/json" -d '{"label":"Full Name"}'`.
- **DELETE:** `curl -X DELETE .../api/engine/questions/<questionId>`.
- **Reorder:** `curl -X POST .../api/engine/questions/reorder -H "Content-Type: application/json" -d '{"blockId":"...","questionIds":["id1","id2"]}'`.
