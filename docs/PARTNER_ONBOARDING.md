# Partner Onboarding Guide

**Purpose**: Guide for external marketplaces or products integrating with Trust & Escrow  
**Target Audience**: Partner developers  
**Integration Time**: ~1 day for basic integration

---

## What This Service Is

Trust & Escrow is a **rules-based escrow + dispute resolution service** with:
- Transparent audit trail (append-only ledger)
- Automated state transitions (no manual intervention)
- Constrained admin operations (no arbitrary outcomes)
- Category support (Real Estate, Used Car, extensible via templates)
- Country-specific templates (KR, MN, JP, IN, PH, KH, TW)

---

## Core Lifecycle

All deals follow the same state machine (no exceptions):

```
CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
                                                      ↑
                                                  (ISSUE overlay)
```

**Key Points**:
- `ISSUE` is an **overlay**, not a replacement flow
- States are **canonical** (English keys: CREATED, FUNDED, etc.)
- UI labels are **localized** (ko/en/etc.) but keys never change
- No pause, no manual settlement, no hidden timers

---

## Required API Calls

### 1. Create Deal

```http
POST /api/deals
Content-Type: application/json
X-User-Id: {buyer-user-id}
X-Idempotency-Key: {client-generated-key}

{
  "buyerId": "uuid",
  "sellerId": "uuid",
  "itemRef": "your-internal-reference",
  "category": "USED_CAR_PRIVATE" | "REAL_ESTATE_SALE" | ...,
  "totalAmount": 10000.00,
  "currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "deal-uuid",
    "state": "CREATED",
    "category": "USED_CAR_PRIVATE",
    "totalAmount": 10000.00,
    "immediateAmount": 8500.00,
    "holdbackAmount": 1500.00,
    "currency": "USD",
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

### 2. Fund Deal

```http
POST /api/deals/{deal-id}/fund
X-User-Id: {buyer-user-id}
X-Idempotency-Key: {client-generated-key}
```

**Response**: Deal state transitions to `FUNDED`

**What Happens**:
- Escrow ledger entries created: `HOLD` for immediate + holdback amounts
- Money is held in escrow

### 3. Deliver Deal

```http
POST /api/deals/{deal-id}/deliver
X-User-Id: {seller-user-id}
X-Idempotency-Key: {client-generated-key}
```

**Response**: Deal state transitions to `DELIVERED` → `INSPECTION`

**What Happens**:
- Immediate amount released to seller (per template)
- `AUTO_APPROVE` timer starts (duration varies by category)
- Evidence metadata can be attached

### 4. Approve Deal

```http
POST /api/deals/{deal-id}/approve
X-User-Id: {buyer-user-id}
X-Idempotency-Key: {client-generated-key}
```

**Response**: Deal state transitions to `APPROVED` → `SETTLED`

**What Happens**:
- Holdback released to seller
- Deal finalized

### 5. Raise Issue

```http
POST /api/deals/{deal-id}/issue
Content-Type: application/json
X-User-Id: {buyer-user-id}
X-Idempotency-Key: {client-generated-key}

{
  "reasonCode": "DAMAGE_MINOR" | "DOCUMENT_MISMATCH" | ...,
  "freeText": "optional text (required if reasonCode is OTHER)",
  "evidenceIds": ["evidence-uuid-1", "evidence-uuid-2"]
}
```

**Response**: Deal state transitions to `ISSUE`

**What Happens**:
- `DISPUTE_TTL` timer starts
- Dispute case created
- Evidence required (unless template waives)

### 6. Read Deal State

```http
GET /api/deals/{deal-id}
X-User-Id: {user-id}
```

**Response**: Current deal state and metadata

### 7. Read Timeline (Source of Truth)

```http
GET /api/deals/{deal-id}/timeline
X-User-Id: {user-id}
```

**Response**: Chronological audit events + ledger entries

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "STATE_TRANSITION",
        "timestamp": "2026-02-01T10:00:00Z",
        "data": {
          "from": "CREATED",
          "to": "FUNDED",
          "actor": "buyer-user-id"
        }
      },
      {
        "type": "LEDGER_ENTRY",
        "timestamp": "2026-02-01T10:00:05Z",
        "data": {
          "type": "HOLD",
          "amount": 10000.00,
          "fromAccount": "buyer",
          "toAccount": "escrow"
        }
      }
    ]
  }
}
```

---

## Idempotency Rules

**Critical**: All mutation requests must include idempotency keys.

### Client-Generated Keys
- Generate unique key per mutation request
- Format: `{partner-id}-{operation}-{timestamp}-{random}`
- Example: `partner-123-fund-20260201100000-abc123`

### Retry Behavior
- **Same key, same request**: Returns same result (no duplicate)
- **Same key, different request**: Returns error (idempotency conflict)
- **Different key**: New request processed

### Implementation
```http
X-Idempotency-Key: {your-unique-key}
```

**Best Practice**:
- Store idempotency keys in your database
- Retry with same key on network errors
- Never reuse keys for different operations

---

## Role Model

### User Roles
- **BUYER**: Can fund, approve, raise issue
- **SELLER**: Can deliver
- **OPERATOR**: Can resolve disputes (constrained)

### Role Enforcement
- Backend enforces role-based actions
- Frontend should validate before API calls (UX optimization)
- Backend is safety net (returns error if role mismatch)

### Mapping Your Users
- Map your internal user IDs to escrow user IDs
- Pass user ID in `X-User-Id` header
- Role determined by action context (buyer/seller per deal)

---

## Security Expectations

### Authentication
- **Current**: `X-User-Id` header (for demo/pilot)
- **Production**: JWT tokens or API keys (to be implemented)

### Role Enforcement
- Backend validates user role for each action
- Admin routes require `OPERATOR` role

### HTTPS Required
- All API calls must use HTTPS in production
- Local development may use HTTP

---

## What Partners Should NOT Expect

### Forbidden Features
- ❌ **No pause button**: Deals cannot be paused
- ❌ **No manual settlement**: Buyers/sellers cannot manually settle
- ❌ **No arbitrary admin outcomes**: Admin cannot type free-form resolutions
- ❌ **No hidden timers**: All timers always visible
- ❌ **No state skipping**: Must follow lifecycle (CREATED → FUNDED → ...)

### Constrained Admin Operations
- Admin can only select **rule-allowed outcomes** (dropdown)
- Admin must provide **audit reason** for all actions
- Admin cannot override state machine

### Evidence Requirements
- Evidence required for issue creation (default)
- Template can waive requirement (rare)
- Evidence metadata stored, not files (URIs only)

---

## Integration Checklist

### Phase 1: Basic Integration (Day 1)
- [ ] Create deal API call working
- [ ] Fund deal API call working
- [ ] Deliver deal API call working
- [ ] Approve deal API call working
- [ ] Read deal state API call working
- [ ] Idempotency keys implemented

### Phase 2: Issue Handling (Day 2)
- [ ] Raise issue API call working
- [ ] Evidence upload working (if separate endpoint)
- [ ] Timeline reading working
- [ ] Dispute resolution handling (if admin)

### Phase 3: Production Readiness
- [ ] Error handling implemented
- [ ] Retry logic with idempotency
- [ ] Webhook integration (if available)
- [ ] Monitoring/logging setup

---

## Error Handling

### Common Errors

**400 Bad Request**:
- Invalid request body
- Missing required fields
- Invalid state transition

**403 Forbidden**:
- Role mismatch (e.g., seller trying to approve)
- Admin route accessed by non-admin

**404 Not Found**:
- Deal ID not found
- Invalid deal ID format

**409 Conflict**:
- Idempotency key conflict
- State transition conflict

**500 Internal Server Error**:
- Retry with same idempotency key
- Check logs if persistent

### Retry Strategy
1. Network errors: Retry with same idempotency key
2. 5xx errors: Retry with exponential backoff
3. 4xx errors: Do not retry (fix request)

---

## Next Steps

1. **API Consumer Flow**: See `/docs/API_CONSUMER_FLOW.md`
2. **Webhooks & Idempotency**: See `/docs/WEBHOOKS_AND_IDEMPOTENCY.md`
3. **Country Templates**: See `/docs/COUNTRY_TEMPLATE_MATRIX.md`
4. **Demo Script**: See `/docs/DEMO_SCRIPT.md`

---

## Support

For integration questions:
- Check API documentation
- Review demo seed guide: `/docs/DEMO_SEED_GUIDE.md`
- Test with demo deals first
