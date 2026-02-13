# Block Questions — Verification

## Changed files

### APIs
- `escrow-ui/lib/db.ts` — added `withTransaction()` for reorder
- `escrow-ui/app/api/engine/blocks/[blockId]/questions/route.ts` — GET/POST (unchanged behavior)
- `escrow-ui/app/api/engine/questions/[questionId]/route.ts` — PATCH/DELETE (unchanged)
- `escrow-ui/app/api/engine/questions/reorder/route.ts` — uses `orderedQuestionIds`, order_index 0..N-1, `withTransaction`
- `escrow-ui/app/api/engine/trades/[tradeId]/blocks/[blockId]/answers/route.ts` — tradeId/blockId validation via store
- `escrow-ui/app/api/engine/trades/[tradeId]/blocks/[blockId]/attachments/route.ts` — `fileName`, `storage_provider` NONE, returns `attachmentId`

### UI
- `escrow-ui/app/transaction/builder/[id]/page.tsx` — Block Questions section, Add Question, list by `question.id`, type/label/description/required/options/DATE/FILE; removed numeric dueDates input; `dueDatesDerivedFromBlock` note
- `escrow-ui/lib/i18n/ko.ts` — block questions + dueDatesDerivedFromBlock keys
- `escrow-ui/lib/i18n/en.ts` — same

### Tests
- `escrow-ui/lib/block-questions/__tests__/reorder-validation.test.ts` — reorder contract and idempotency shape
- Existing: `validateAnswer.test.ts`, `block-date-constraints.test.ts`

---

## Manual verification

1. **Builder**
   - Open `/transaction/builder/[id]` for a DRAFT transaction.
   - In each block, see "Block Questions" section and "+ Add Question".
   - Add a question: type SHORT_TEXT, label "Name", required on. Save (onBlur or implicit).
   - Add a second question, type DROPDOWN, options "A, B, C". Reorder with ↑/↓.
   - Confirm no duplicate rows after refresh (keys = question.id).
   - Work Rules: numeric "Due Dates" free input removed; message "Due dates are derived from block period" shown.

2. **Date policy**
   - Change block date outside transaction range → expect validation error.
   - Add blocks until no room → expect error (e.g. "Cannot split block further" or similar).

---

## cURL examples

Base URL: `http://localhost:3000` (or your origin). Replace `<blockId>`, `<questionId>`, `<tradeId>` with real IDs.

### Questions CRUD
```bash
# List questions
curl -s "http://localhost:3000/api/engine/blocks/<blockId>/questions"

# Create question
curl -s -X POST "http://localhost:3000/api/engine/blocks/<blockId>/questions" \
  -H "Content-Type: application/json" \
  -d '{"type":"SHORT_TEXT","label":"Full name","required":true}'

# Update question
curl -s -X PATCH "http://localhost:3000/api/engine/questions/<questionId>" \
  -H "Content-Type: application/json" \
  -d '{"label":"Your full name"}'

# Delete question
curl -s -X DELETE "http://localhost:3000/api/engine/questions/<questionId>"

# Reorder (0..N-1)
curl -s -X POST "http://localhost:3000/api/engine/questions/reorder" \
  -H "Content-Type: application/json" \
  -d '{"blockId":"<blockId>","orderedQuestionIds":["id2","id1"]}'
```

### Answers (required validation)
```bash
# Missing required → 400
curl -s -X POST "http://localhost:3000/api/engine/trades/<tradeId>/blocks/<blockId>/answers" \
  -H "Content-Type: application/json" \
  -d '{"actorRole":"BUYER","answers":[]}'

# With required filled
curl -s -X POST "http://localhost:3000/api/engine/trades/<tradeId>/blocks/<blockId>/answers" \
  -H "Content-Type: application/json" \
  -d '{"actorRole":"BUYER","answers":[{"questionId":"<questionId>","answer":"John"}]}'
```

### Attachments (metadata-only)
```bash
curl -s -X POST "http://localhost:3000/api/engine/trades/<tradeId>/blocks/<blockId>/attachments" \
  -H "Content-Type: application/json" \
  -d '{"uploaderRole":"SELLER","fileName":"doc.pdf","mime":"application/pdf","size":1024}'
# → { "ok": true, "data": { "attachmentId": "...", "id": "..." } }
```

---

## Build

```bash
cd escrow-ui && npm run test && npx next build
```

All tests must pass; Next build must complete without errors.
