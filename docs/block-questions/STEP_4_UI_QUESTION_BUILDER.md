# STEP 4 — UI: Question Builder (Google Forms style)

## Objective

In the transaction builder page, add a Block Questions section per block (replace or extend the current work-rule numeric deadline UI). Use stable keys (`question.id`) to avoid duplicate rows on rerender.

## Files to Create/Modify

| Action | Path |
|--------|------|
| Modify | `escrow-ui/app/transaction/builder/[id]/page.tsx` |
| Modify | `escrow-ui/lib/i18n/ko.ts`, `escrow-ui/lib/i18n/en.ts` (keys for questions) |

## Exact Tasks

### 1. Builder page

- **Add “Block Questions” section** inside each block card (e.g. below Approvers or alongside Work Rules). “Add Question” button (only when `isDraft`) that calls `POST /api/engine/blocks/[blockId]/questions` with default body `{ type: 'SHORT_TEXT', label: '', required: false }`, then refetch or append to local state.
- **List questions** from API `GET /api/engine/blocks/[blockId]/questions`. Render each with `key={question.id}` (never index) to prevent duplicate UI rows.
- **Per-question UI:**
  - Type selector: `<select>` with SHORT_TEXT, LONG_TEXT, CHECKBOX, DROPDOWN, RADIO, DATE, FILE, NUMBER, GRID_SINGLE.
  - Label and description: `<input>` / `<textarea>`.
  - Required: toggle (checkbox).
  - Duplicate action: clone question to same block with next order index.
  - Options editor:
    - CHECKBOX/RADIO/DROPDOWN: `options.choices[] = { value, label }`
    - GRID_SINGLE: `options.rows[]`, `options.columns[]`
    - NUMBER: `options.min`, `options.max`
  - DATE: date picker only (no free numeric input).
  - FILE: upload control + attachments metadata API 연결 (storage provider = NONE for now).
- **Save:** On blur or “Save” use PATCH `/api/engine/questions/[questionId]`. Optional: debounce to avoid excessive requests.
- **Delete:** Button to DELETE `/api/engine/questions/[questionId]` and remove from list.
- **Reorder:** drag-handle 우선, fallback up/down. On change call `POST /api/engine/questions/reorder` with `{ blockId, orderedQuestionIds }` (new order), then refetch.

### 1-b. Block readiness badge

- Builder에서 블록별 readiness를 조회:
  - `GET /api/engine/trades/[tradeId]/blocks/[blockId]/readiness`
  - 응답: `{ ready, missingRequired[] }`
- 카드 상단에 READY / NOT READY badge를 표시해 필수 질문 충족 여부를 즉시 확인.

### 2. Work Rules vs Questions

- Keep existing Work Rules UI for now (or hide when “Block Questions” is enabled per template). Instruction: “Replace the current work rule numeric deadline inputs” — interpret as: add Questions as the primary block form; work rules can remain for backward compatibility but the main form flow is questions. If you fully replace, remove the due-dates numeric input and use Questions for block-level form fields.

### 3. i18n

- Add keys e.g. `blockQuestions`, `addQuestion`, `questionType`, `label`, `description`, `required`, `options`, `date`, `fileUpload` in `ko.ts` and `en.ts`.

## Verification

- Add a block → click “Add Question” → see one question row with type/label/required.
- Change type to DROPDOWN → options editor appears; add options, save → PATCH succeeds.
- Refresh page → questions still listed in correct order; no duplicate rows (check by adding 2 questions and refreshing).
- Reorder via drag/up/down → order persists after refresh.
- Required FILE question without attachment => NOT READY.
- Required DATE/CHECKBOX with valid answers/attachments => READY.
