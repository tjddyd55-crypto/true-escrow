# Ready-to-use prompts (for Cursor + Figma work)

Date: 2026-01-31

## A) Prompt to assign Cursor implementation (engine)
Copy/paste to Cursor:

You are implementing an SSOT DevPack.  
Read all files in `/develop/cursor_devpack` and implement them **strictly in order** (01→11).  
For each file:
- follow the SSOT exactly (no redesign)
- implement server-authoritative state transitions
- implement idempotent ledger actions
- emit audit events for every mutation
- satisfy all Acceptance Criteria and Do-Not rules
After completing a file, append a short entry to `CHANGELOG.md` describing what you implemented and what tests you ran.
Stop only when all 01→11 are complete and tests pass.

## B) Prompt to generate Figma work instructions (after engine exists)
Copy/paste to Cursor (to produce a Figma task doc per file 00→05):

Read `/develop/figma_devpack` (00→05) and `/develop/cursor_devpack`.  
Create a Figma 작업 지시서 (markdown) for each Figma file 00→05 that:
- lists required frames, components, and done criteria
- enforces Do-Not-Break rules
- uses exact terminology for states, timers, and reason codes
Do not introduce new UI concepts beyond these DevPacks.

## C) Prompt to the person working in Figma
Copy/paste as an instruction to the designer/operator:

Follow the markdown Figma 작업 지시서 exactly.  
Create frames and components as specified.  
Do not rename states, timers, or reason codes.  
Do not add “pause” or “manual settle” features.  
When uncertain, prefer showing the timeline, timers, and evidence requirements.
