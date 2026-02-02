# Frontend Integration Contract

**Version**: 1.0  
**Date**: 2026-01-31  
**Status**: Binding Contract (Non-negotiable)

## Purpose

This document defines a **strict contract** between the backend SSOT (Single Source of Truth) and frontend UI implementation. It prevents state, language, or action mismatches during implementation and enables global i18n support without structural changes.

**This is a binding contract, not a suggestion.** All frontend implementations must comply with these rules.

---

## 1. Canonical State Mapping

### Contract Rule
Frontend MUST use exact canonical state keys from backend. No translation, renaming, or replacement of state keys is permitted.

### State Definitions

#### CREATED
- **Canonical Key**: `CREATED` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER`, `SELLER` (view only)
- **Allowed UI Actions**:
  - `BUYER`: "Fund Deal" button → `POST /api/deals/:id/fund`
  - `SELLER`: None (view only)
- **Forbidden UI Actions**:
  - Deliver button
  - Approve button
  - Raise issue button
  - Any state transition action
- **Required Timers**: None
- **Evidence Required**: No
- **Next Valid States**: `FUNDED` only

#### FUNDED
- **Canonical Key**: `FUNDED` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER` (view only), `SELLER` (action)
- **Allowed UI Actions**:
  - `SELLER`: "Mark Delivered" button → `POST /api/deals/:id/deliver`
  - `BUYER`: None (view only)
- **Forbidden UI Actions**:
  - Approve button
  - Raise issue button
  - Fund button (already funded)
- **Required Timers**: None
- **Evidence Required**: No
- **Next Valid States**: `DELIVERED` only
- **Money Display**: 
  - Show `immediateAmount` (default 70%) as "Will be released to seller at DELIVERED"
  - Show `holdbackAmount` (default 30%) as "Held in escrow until APPROVED"

#### DELIVERED
- **Canonical Key**: `DELIVERED` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER`, `SELLER` (view), `SYSTEM` (auto-transition)
- **Allowed UI Actions**:
  - `SELLER`: "Upload Evidence" button (optional)
  - `SYSTEM`: Auto-transition to `INSPECTION` (no user action)
- **Forbidden UI Actions**:
  - Approve button (not yet in inspection)
  - Raise issue button (not yet in inspection)
- **Required Timers**: None (immediate transition to INSPECTION)
- **Evidence Required**: No (optional for seller)
- **Next Valid States**: `INSPECTION` (automatic)
- **Money Display**:
  - `immediateAmount` should show as "Released to seller" (if released at DELIVERED)
  - `holdbackAmount` remains "Held in escrow"

#### INSPECTION
- **Canonical Key**: `INSPECTION` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER` (action), `SELLER` (view only)
- **Allowed UI Actions**:
  - `BUYER`: 
    - "Approve" button → `POST /api/deals/:id/approve`
    - "Raise Issue" button → `POST /api/deals/:id/issue`
  - `SELLER`: None (waiting)
- **Forbidden UI Actions**:
  - `SELLER`: Any action buttons
  - Deliver button (already delivered)
- **Required Timers**: 
  - `AUTO_APPROVE` timer MUST be displayed (MUST NOT be hidden)
  - Timer MUST show countdown and explanation: "If buyer does not respond, deal will auto-approve"
- **Evidence Required**: No (required only if ISSUE is raised)
- **Next Valid States**: `APPROVED` (buyer approves OR auto-approve fires), `ISSUE` (buyer raises issue)
- **Money Display**:
  - `holdbackAmount` remains "Held in escrow until APPROVED or auto-approve"

#### APPROVED
- **Canonical Key**: `APPROVED` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER`, `SELLER` (view only), `SYSTEM` (action)
- **Allowed UI Actions**:
  - `SYSTEM`: Auto-release holdback → transition to `SETTLED`
  - `BUYER`/`SELLER`: None (view only)
- **Forbidden UI Actions**:
  - Any user-initiated action buttons
  - Manual settlement button
- **Required Timers**: 
  - `HOLDBACK_RELEASE` condition MUST be displayed
  - MUST show: "Holdback will be released automatically"
- **Evidence Required**: No
- **Next Valid States**: `SETTLED` (automatic)
- **Money Display**:
  - `holdbackAmount` should show as "Will be released to seller"

#### ISSUE
- **Canonical Key**: `ISSUE` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER` (action), `SELLER` (view only), `OPERATOR` (admin action)
- **Allowed UI Actions**:
  - `BUYER`: 
    - "Upload Evidence" button (REQUIRED if not already uploaded)
    - "View Resolution Timeline" button (read-only)
  - `OPERATOR`: 
    - "Resolve Dispute" button → `POST /api/admin/disputes/:id/resolve`
    - Resolution dropdown (constrained to rule-allowed outcomes only)
- **Forbidden UI Actions**:
  - `SELLER`: Any action buttons
  - Manual settlement without admin role
- **Required Timers**: 
  - `DISPUTE_TTL` timer MUST be displayed (MUST NOT be hidden)
  - Timer MUST show countdown and explanation: "If TTL expires, default resolution will be applied"
- **Evidence Required**: YES (MUST be enforced in UI before allowing issue creation)
- **Next Valid States**: `SETTLED` (rule outcome + timer)
- **Money Display**:
  - Show potential `OFFSET` amount (if applicable)
  - Show `holdbackAmount` as "May be offset or released based on resolution"

#### SETTLED
- **Canonical Key**: `SETTLED` (MUST NOT be translated)
- **Allowed User Roles**: `BUYER`, `SELLER`, `OPERATOR` (all view only)
- **Allowed UI Actions**: None (terminal state, read-only)
- **Forbidden UI Actions**: All action buttons
- **Required Timers**: None (terminal state)
- **Evidence Required**: No
- **Next Valid States**: None (terminal)
- **Money Display**:
  - All amounts finalized
  - Show complete ledger summary

---

## 2. Timer Display Contract

### Contract Rule
Timers MUST be displayed when active. Hiding timers is FORBIDDEN. Timers are critical for user understanding of automatic state transitions.

### AUTO_APPROVE Timer

#### When It Must Be Shown
- **State**: `INSPECTION`
- **Condition**: Timer is active (not yet fired)
- **Display Requirement**: MUST be visible, MUST NOT be hidden

#### Display Format
```
[AUTO_APPROVE] / [Localized Label]
Countdown: [remaining time]
Explanation: "If buyer does not respond, deal will auto-approve"
```

#### User Behavior Implication
- Buyer MUST understand that inaction will result in automatic approval
- UI MUST make this consequence clear
- Timer countdown MUST be prominent

#### When It Must Never Be Hidden
- While deal is in `INSPECTION` state
- While timer is active (not fired)
- Even if buyer is actively viewing the page

### DISPUTE_TTL Timer

#### When It Must Be Shown
- **State**: `ISSUE` or `DISPUTE_OPEN`
- **Condition**: Dispute is open (status = OPEN)
- **Display Requirement**: MUST be visible, MUST NOT be hidden

#### Display Format
```
[DISPUTE_TTL] / [Localized Label]
Countdown: [remaining time]
Explanation: "If TTL expires, default resolution will be applied"
```

#### User Behavior Implication
- All parties MUST understand that dispute has a time limit
- Default resolution outcome MUST be visible
- UI MUST show what happens when TTL expires

#### When It Must Never Be Hidden
- While deal is in `ISSUE` state
- While dispute status is OPEN
- Even during admin review

### HOLDBACK_RELEASE Timer/Condition

#### When It Must Be Shown
- **State**: `APPROVED`
- **Condition**: Holdback is unreleased
- **Display Requirement**: MUST be visible, MUST NOT be hidden

#### Display Format
```
[HOLDBACK_RELEASE] / [Localized Label]
Condition: "Holdback will be released automatically"
Status: "Pending release"
```

#### User Behavior Implication
- Seller MUST understand when holdback will be released
- Release condition MUST be clear
- Automatic nature MUST be emphasized

#### When It Must Never Be Hidden
- While deal is in `APPROVED` state
- While holdback is unreleased
- Until transition to `SETTLED`

---

## 3. i18n Contract

### Contract Rule
Canonical keys remain English-only in all code, API responses, and data storage. UI labels are locale-based and handled in the presentation layer only.

### Canonical Keys (MUST NOT be translated)

#### DealState Keys
```typescript
type DealState = 
  | "CREATED"
  | "FUNDED"
  | "DELIVERED"
  | "INSPECTION"
  | "APPROVED"
  | "ISSUE"
  | "SETTLED";
```

#### Timer Keys
```typescript
type TimerKey = 
  | "AUTO_APPROVE"
  | "DISPUTE_TTL"
  | "HOLDBACK_RELEASE";
```

#### IssueReasonCode Keys
```typescript
type IssueReasonCode = 
  | "NOT_DELIVERED"
  | "DAMAGE_MAJOR"
  | "DAMAGE_MINOR"
  | "MISSING_PARTS"
  | "QUALITY_NOT_MATCHING"
  | "DOCUMENT_MISMATCH"
  | "OTHER";
```

#### LedgerEntryType Keys
```typescript
type LedgerEntryType = 
  | "HOLD"
  | "RELEASE"
  | "REFUND"
  | "OFFSET";
```

#### DealCategory Keys
```typescript
type DealCategory = 
  | "CAR"
  | "REAL_ESTATE_RENTAL"
  | "REAL_ESTATE_SALE"
  | "HIGH_VALUE_USED"
  | "B2B_DELIVERY";
```

#### Role Keys
```typescript
type Role = 
  | "BUYER"
  | "SELLER"
  | "OPERATOR"
  | "INSPECTOR";
```

### UI Labels (Locale-Based)

#### i18n Key Structure (JSON-style)

```json
{
  "states": {
    "CREATED": {
      "ko": "거래 생성됨",
      "en": "Created"
    },
    "FUNDED": {
      "ko": "자금 보관됨",
      "en": "Funded"
    },
    "DELIVERED": {
      "ko": "배송 완료",
      "en": "Delivered"
    },
    "INSPECTION": {
      "ko": "검수 중",
      "en": "Under Inspection"
    },
    "APPROVED": {
      "ko": "승인됨",
      "en": "Approved"
    },
    "ISSUE": {
      "ko": "문제 제기",
      "en": "Issue Raised"
    },
    "SETTLED": {
      "ko": "정산 완료",
      "en": "Settled"
    }
  },
  "timers": {
    "AUTO_APPROVE": {
      "ko": "자동 승인",
      "en": "Auto Approve"
    },
    "DISPUTE_TTL": {
      "ko": "분쟁 TTL",
      "en": "Dispute TTL"
    },
    "HOLDBACK_RELEASE": {
      "ko": "보류 해제",
      "en": "Holdback Release"
    }
  },
  "reasonCodes": {
    "NOT_DELIVERED": {
      "ko": "미배송",
      "en": "Not Delivered"
    },
    "DAMAGE_MAJOR": {
      "ko": "심각한 손상",
      "en": "Major Damage"
    },
    "DAMAGE_MINOR": {
      "ko": "경미한 손상",
      "en": "Minor Damage"
    },
    "MISSING_PARTS": {
      "ko": "부품 누락",
      "en": "Missing Parts"
    },
    "QUALITY_NOT_MATCHING": {
      "ko": "품질 불일치",
      "en": "Quality Not Matching"
    },
    "DOCUMENT_MISMATCH": {
      "ko": "서류 불일치",
      "en": "Document Mismatch"
    },
    "OTHER": {
      "ko": "기타",
      "en": "Other"
    }
  },
  "ledgerTypes": {
    "HOLD": {
      "ko": "보관",
      "en": "Hold"
    },
    "RELEASE": {
      "ko": "해제",
      "en": "Release"
    },
    "REFUND": {
      "ko": "환불",
      "en": "Refund"
    },
    "OFFSET": {
      "ko": "상계",
      "en": "Offset"
    }
  },
  "actions": {
    "fundDeal": {
      "ko": "거래 자금 입금",
      "en": "Fund Deal"
    },
    "markDelivered": {
      "ko": "배송 완료 표시",
      "en": "Mark Delivered"
    },
    "approve": {
      "ko": "승인",
      "en": "Approve"
    },
    "raiseIssue": {
      "ko": "문제 제기",
      "en": "Raise Issue"
    },
    "uploadEvidence": {
      "ko": "증빙 업로드",
      "en": "Upload Evidence"
    }
  }
}
```

### Rules for Adding New Languages

1. **No Structural Changes Required**:
   - Add new locale key to existing i18n structure
   - No backend changes needed
   - No API contract changes needed

2. **Implementation Pattern**:
```typescript
// Frontend implementation
const getLocalizedLabel = (
  canonicalKey: string,
  category: 'states' | 'timers' | 'reasonCodes' | 'ledgerTypes',
  locale: string
): string => {
  return i18n[category][canonicalKey]?.[locale] || canonicalKey;
};

// Usage
const stateLabel = getLocalizedLabel('INSPECTION', 'states', 'ko');
// Returns: "검수 중"
```

3. **Fallback Behavior**:
   - If locale not found, fallback to canonical key
   - Never fallback to empty string
   - Log missing translations for monitoring

4. **Dual-Label Display (Optional)**:
   - For development/debugging: Show both canonical key and localized label
   - Format: `[Canonical Key] / [Localized Label]`
   - Example: `INSPECTION / 검수 중`

---

## 4. Money Display Contract

### Contract Rule
Money amounts and flows MUST be displayed transparently. Users MUST understand where money is and what conditions trigger releases.

### Immediate Amount Rules

#### Display Requirements
- **Label**: "Immediate Amount" (localized)
- **Default Percentage**: 70% of total amount
- **Display Format**: 
  ```
  Immediate Amount: $700.00 (70%)
  Status: [Will be released at DELIVERED | Released to seller]
  ```

#### State-Based Display
- **CREATED/FUNDED**: "Will be released to seller at DELIVERED"
- **DELIVERED+**: "Released to seller" (if released at DELIVERED)
- **ISSUE**: Show if already released (read-only)

#### Rules
- MUST show percentage (default 70%)
- MUST show release condition
- MUST NOT imply "full freeze" unless template explicitly allows

### Holdback Amount Rules

#### Display Requirements
- **Label**: "Holdback Amount" (localized)
- **Default Percentage**: 30% of total amount
- **Display Format**:
  ```
  Holdback Amount: $300.00 (30%)
  Status: [Held in escrow | Will be released at APPROVED | Released to seller]
  ```

#### State-Based Display
- **CREATED/FUNDED/DELIVERED/INSPECTION**: "Held in escrow until APPROVED or auto-approve"
- **APPROVED**: "Will be released to seller automatically"
- **SETTLED**: "Released to seller" (finalized)
- **ISSUE**: "May be offset or released based on resolution"

#### Rules
- MUST show percentage (default 30%)
- MUST show release condition
- MUST emphasize "never stuck forever" (released by rules/timers)
- MUST NOT show as "frozen indefinitely"

### OFFSET Display Rules

#### When to Display
- **State**: `ISSUE` or `SETTLED` (if offset occurred)
- **Condition**: Ledger contains `OFFSET` entry

#### Display Format
```
Offset Amount: $50.00
Reason: [IssueReasonCode localized label]
From: Holdback
To: Buyer
```

#### Rules
- MUST show offset amount separately from holdback
- MUST show reason code (localized)
- MUST show source (holdback) and destination (buyer)
- MUST link to ledger entry for audit trail

### Ledger Read-Only Enforcement

#### Contract Rule
Ledger entries are **append-only**. Frontend MUST NOT allow editing, deletion, or modification of ledger entries.

#### Display Requirements
- Show all ledger entries in chronological order
- Each entry MUST show:
  - Type: `HOLD`, `RELEASE`, `REFUND`, `OFFSET` (with localized label)
  - Amount
  - From account → To account
  - Reference ID (link to audit event)
  - Timestamp
  - Created by (system/admin)

#### UI Constraints
- No edit buttons
- No delete buttons
- No modify buttons
- Read-only display only
- Audit trail link MUST be provided

#### Reconciliation Display
- Show ledger sum: `Total Held - Total Released = Current Balance`
- MUST reconcile with deal financial summary
- Show any discrepancies (if any)

---

## 5. Action Guardrails

### Contract Rule
UI MUST enforce role + state constraints visually. UI MUST NOT rely on backend errors to block actions. Illegal actions MUST NOT be exposed in UI.

### UI Must Not Expose Illegal Actions

#### Rule
If an action is not allowed for the current state + role combination, the button/action MUST NOT appear in the UI.

#### Examples

**FORBIDDEN**:
```typescript
// ❌ WRONG: Showing button and relying on backend error
<Button onClick={approveDeal} disabled={state !== 'INSPECTION'}>
  Approve
</Button>
```

**REQUIRED**:
```typescript
// ✅ CORRECT: Not showing button at all
{state === 'INSPECTION' && role === 'BUYER' && (
  <Button onClick={approveDeal}>Approve</Button>
)}
```

### UI Must Enforce Role + State Constraints Visually

#### Visual Enforcement Rules

1. **Button Visibility**:
   - Show button ONLY when: `allowedStates.includes(currentState) && allowedRoles.includes(currentRole)`
   - Hide button when conditions not met
   - Do NOT show disabled buttons for illegal actions

2. **Action Panel Display**:
   - Show action panel ONLY when user has at least one allowed action
   - Hide action panel when no actions available
   - Show "Waiting for [role] action" message when appropriate

3. **State-Based UI**:
   - Different UI layout for each state
   - State-specific messaging
   - State-specific action sets

#### Implementation Pattern
```typescript
const getAllowedActions = (
  state: DealState,
  role: Role
): Action[] => {
  const actionMatrix: Record<DealState, Record<Role, Action[]>> = {
    CREATED: {
      BUYER: ['fundDeal'],
      SELLER: [],
      OPERATOR: []
    },
    INSPECTION: {
      BUYER: ['approve', 'raiseIssue'],
      SELLER: [],
      OPERATOR: []
    },
    // ... etc
  };
  
  return actionMatrix[state]?.[role] || [];
};

// In component
const allowedActions = getAllowedActions(deal.state, user.role);
{allowedActions.map(action => (
  <ActionButton key={action} action={action} />
))}
```

### UI Must Not Rely on Backend Errors

#### Rule
Frontend MUST validate state + role before making API calls. Backend errors are a safety net, not the primary validation.

#### Implementation Pattern
```typescript
// ✅ CORRECT: Frontend validation first
const handleApprove = async () => {
  // Frontend validation
  if (deal.state !== 'INSPECTION') {
    showError('Cannot approve: Deal is not in INSPECTION state');
    return;
  }
  
  if (user.role !== 'BUYER') {
    showError('Only buyer can approve');
    return;
  }
  
  // Then make API call (backend will also validate)
  try {
    await api.post(`/api/deals/${deal.id}/approve`);
  } catch (error) {
    // Handle backend error (safety net)
    showError(error.message);
  }
};
```

---

## 6. Non-Negotiables

### Contract Rule
These rules are **absolute and non-negotiable**. Violation of these rules breaks the trust model of the platform.

### No Pause

#### Rule
UI MUST NOT provide a "pause deal" or "suspend deal" button or action.

#### Rationale
The platform's core promise is that transactions finish via rules + timers + evidence, not human availability. Pausing breaks this promise.

#### Enforcement
- No pause button in any state
- No suspend action in API
- No "manual hold" feature
- Timers continue even if users are inactive

### No Manual Settlement

#### Rule
UI MUST NOT provide a "manual settle" or "force settle" button for buyers or sellers.

#### Exceptions
- `OPERATOR` role may have constrained settlement options (see Admin section)
- Settlement must follow rule-allowed outcomes only
- All settlements must be auditable

#### Enforcement
- No "Settle Now" button for buyers/sellers
- No "Force Complete" action for non-admin users
- Settlement happens automatically via rules/timers

### No Hidden Timers

#### Rule
Active timers MUST be visible. Hiding timers is FORBIDDEN.

#### Enforcement
- `AUTO_APPROVE` timer MUST be visible in `INSPECTION` state
- `DISPUTE_TTL` timer MUST be visible in `ISSUE` state
- `HOLDBACK_RELEASE` condition MUST be visible in `APPROVED` state
- Timers MUST NOT be hidden in collapsed sections
- Timers MUST NOT be hidden behind "advanced" toggles

### No Full Freeze Unless Template Allows

#### Rule
UI MUST NOT imply or display "full freeze" (100% held) unless the contract template explicitly allows it.

#### Default Behavior
- Default: `immediateAmount` (70%) + `holdbackAmount` (30%)
- `immediateAmount` is released at `DELIVERED`
- `holdbackAmount` is released at `APPROVED`
- Never show as "all money frozen"

#### Enforcement
- Money display MUST show release conditions
- MUST NOT show "all funds held indefinitely"
- Template override MUST be explicit and visible

### Evidence Required for Issue

#### Rule
UI MUST enforce evidence requirement when raising an issue, unless template explicitly waives it.

#### Enforcement
- "Raise Issue" form MUST require at least one evidence upload
- Form MUST NOT submit without evidence (unless template waives)
- Evidence upload MUST be validated before API call
- Show clear error if evidence missing

### Dispute Must Have TTL

#### Rule
Every dispute (ISSUE state) MUST have a visible TTL countdown.

#### Enforcement
- `DISPUTE_TTL` timer MUST be displayed
- Countdown MUST be visible
- Default resolution outcome MUST be shown
- TTL expiration consequence MUST be clear

### Admin Constrained Actions

#### Rule
Admin (`OPERATOR` role) actions MUST be constrained to rule-allowed outcomes only.

#### Enforcement
- Resolution dropdown MUST only show allowed outcomes
- Free-form text input for resolution is FORBIDDEN
- Admin override MUST require audit reason
- All admin actions MUST be logged

---

## 7. API Response Contract

### Contract Rule
Backend returns canonical keys only. Frontend is responsible for localization.

### Expected API Response Format

#### Deal Response
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "state": "INSPECTION",  // Canonical key, NOT translated
    "category": "CAR",      // Canonical key, NOT translated
    "totalAmount": 1000.00,
    "immediateAmount": 700.00,
    "holdbackAmount": 300.00,
    "currency": "USD"
  },
  "meta": {
    "ruleVersion": "1.0",
    "idempotencyKey": "key"
  }
}
```

#### Timer Response
```json
{
  "timerType": "AUTO_APPROVE",  // Canonical key
  "startedAt": "2026-01-31T10:00:00Z",
  "expiresAt": "2026-02-07T10:00:00Z",
  "active": true
}
```

#### Issue Reason Codes
```json
{
  "reasonCode": "NOT_DELIVERED",  // Canonical key
  "freeText": "..."  // User input, not canonical
}
```

### Frontend Responsibility

1. **Receive canonical keys** from API
2. **Map to localized labels** using i18n structure
3. **Display localized labels** to users
4. **Send canonical keys** back to API (never send translated keys)

---

## 8. Validation Checklist

### Before Frontend Implementation

- [ ] All state mappings defined and understood
- [ ] All timer display rules implemented
- [ ] i18n structure created for all canonical keys
- [ ] Money display rules implemented
- [ ] Action guardrails implemented (no illegal actions shown)
- [ ] Non-negotiables enforced in UI
- [ ] API response handling (canonical keys only)
- [ ] Error handling (frontend validation + backend safety net)

### During Implementation

- [ ] No canonical keys translated in code
- [ ] No illegal actions exposed in UI
- [ ] All timers visible when active
- [ ] Evidence required enforced in forms
- [ ] Money display shows release conditions
- [ ] Role + state constraints enforced visually

### Before Release

- [ ] All states tested with correct actions
- [ ] All timers tested for visibility
- [ ] i18n tested for all supported locales
- [ ] Money display tested for all states
- [ ] Non-negotiables verified (no pause, no manual settle, etc.)
- [ ] API contract compliance verified

---

## 9. Change Management

### Contract Versioning
- This contract is versioned (currently v1.0)
- Breaking changes require contract version bump
- Non-breaking additions (new states, timers) require minor version bump

### Adding New States
1. Update Canonical State Mapping section
2. Define allowed/forbidden actions
3. Define timer requirements
4. Update i18n structure
5. Update action guardrails
6. Bump contract version

### Adding New Languages
1. Add locale to i18n structure
2. No contract changes needed
3. No API changes needed
4. No structural changes needed

---

## 10. References

- Backend SSOT: `develop/cursor_devpack/`
- UI SSOT: `develop/figma_devpack/`
- i18n Rules: `develop/figma_devpack/I18N_AND_LOCALIZATION_RULES.md`
- API Contracts: `develop/cursor_devpack/07_API_CONTRACTS.md`

---

## Summary

This contract ensures:
1. ✅ **State consistency**: Frontend and backend use same canonical states
2. ✅ **Action safety**: Illegal actions never exposed in UI
3. ✅ **Timer visibility**: Critical timers always visible
4. ✅ **i18n support**: Global-ready without structural changes
5. ✅ **Money transparency**: Users understand money flow
6. ✅ **Trust model**: Non-negotiables preserve platform integrity

**This is a binding contract. All frontend implementations must comply.**
