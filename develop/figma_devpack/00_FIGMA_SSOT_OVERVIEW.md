# Figma DevPack — Trust & Escrow UI (SSOT) v1.0
Date: 2026-01-31

This folder defines **UI SSOT** for expressing the Trust & Escrow engine.
It is not “pretty UI”; it is **structural UI** that prevents misinterpretation.

## How to use
- Create a Figma Project: “Trust & Escrow UI DevPack v1”
- Create 6 Figma files matching 00→05
- In each file, create frames exactly as specified.
- Do not change terminology used in Cursor DevPack (states, reason codes, timers).

## Core UI principles (non-negotiable)
1) The transaction is a **timeline/state machine** (always visible).
2) Timers are **never hidden** (auto-approve / dispute TTL / holdback release).
3) “Indefinite pause” UI is forbidden (no “pause deal”).
4) Dispute is an overlay; it must not break the main flow forever.
5) Evidence is not optional for issues (show evidence required).
6) Admin UI is constrained: choose from rule-allowed outcomes only.

## Concept mapping (compression)
Cursor DevPack is detailed; Figma DevPack compresses it into visible structure:
- 03/04/05 (state/rules/ledger) → UI expresses as timeline + financial summary + actions.
- 06 (evidence/audit) → timeline panel + evidence slots.
- 10 (admin ops) → constrained resolution UI.
