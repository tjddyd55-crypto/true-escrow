# STEP 1 — DB Migrations (Block Questions)

## Objective

Add database tables and indexes for the Block Questions system. All tables use the `escrow_*` prefix. This step assumes **`escrow_block_questions`** and index **`idx_escrow_block_questions_block`** already exist; it adds **`escrow_block_answers`** and **`escrow_block_attachments`** plus their constraints and indexes.

## Prerequisites

- **`escrow_block_questions`** (existing) — expected columns for reference:
  - `id` UUID PRIMARY KEY
  - `block_id` UUID NOT NULL (references engine block id)
  - `order_index` INT NOT NULL
  - `type` TEXT (e.g. SHORT_TEXT, LONG_TEXT, CHECKBOX, DROPDOWN, DATE, FILE, NUMBER)
  - `label` TEXT, `description` TEXT
  - `required` BOOLEAN DEFAULT false
  - `options` JSONB (for CHECKBOX/DROPDOWN)
- Index: `idx_escrow_block_questions_block` on `(block_id)`.

## Files to Create/Modify

| Action | Path |
|--------|------|
| Create | `escrow-ui/scripts/004_block_questions.sql` (created; includes optional `escrow_block_questions` creation for greenfield DBs) |

## Exact SQL Tasks

1. **Create `escrow_block_answers`**
   - Columns: `id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `trade_id` UUID NOT NULL, `block_id` UUID NOT NULL, `question_id` UUID NOT NULL, `actor_role` TEXT NOT NULL, `answer` JSONB NOT NULL, `created_at` TIMESTAMPTZ DEFAULT now().
   - No FK to `escrow_trades`/`escrow_blocks` if those do not exist in this DB (engine uses in-memory store); use application-level consistency. If you have `escrow_trades`/`escrow_blocks`, add FKs.

2. **Create `escrow_block_attachments`**
   - Columns: `id` UUID PRIMARY KEY DEFAULT gen_random_uuid(), `trade_id` UUID NOT NULL, `block_id` UUID NOT NULL, `question_id` UUID NULL, `uploader_role` TEXT NOT NULL, `storage_provider` TEXT (e.g. 's3','r2'), `object_key` TEXT, `file_name` TEXT, `mime` TEXT, `size` BIGINT, `status` TEXT DEFAULT 'PENDING', `created_at` TIMESTAMPTZ DEFAULT now().

3. **Indexes**
   - `escrow_block_answers`: index on `(trade_id, question_id, actor_role)`.
   - `escrow_block_attachments`: index on `(trade_id, block_id)`.

4. **Questions table constraint (if you manage it in this script)**
   - Unique constraint on `escrow_block_questions(block_id, order_index)` so reorder is well-defined.

## How to Run SQL

From repo root (or `escrow-ui`):

```bash
# Requires DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
psql "$DATABASE_URL" -f escrow-ui/scripts/004_block_questions.sql
```

Or from `escrow-ui`:

```bash
psql "$DATABASE_URL" -f scripts/004_block_questions.sql
```

## Verification

- **Manual:** Connect with `psql $DATABASE_URL` and run:
  - `\dt escrow_*` — list escrow tables.
  - `\d escrow_block_answers` — check columns and index.
  - `\d escrow_block_attachments` — check columns and index.
- **API:** After STEP 2, answers/attachments APIs will read/write these tables.
