# API Consumer Flow

**Purpose**: Typical integration sequence for partner marketplaces  
**Audience**: Partner developers

---

## Typical Sequence

### 1. Create Deal

**When**: Buyer initiates purchase on your platform

```http
POST /api/deals
X-User-Id: {buyer-id}
X-Idempotency-Key: {unique-key}

{
  "buyerId": "uuid",
  "sellerId": "uuid",
  "itemRef": "your-listing-id-12345",
  "category": "USED_CAR_PRIVATE",
  "totalAmount": 10000.00,
  "currency": "USD"
}
```

**What to Store**:
- Deal ID (from response)
- Item reference (your internal ID)
- Buyer/Seller IDs

**Next**: Wait for buyer to fund

---

### 2. Fund Deal

**When**: Buyer deposits payment

```http
POST /api/deals/{deal-id}/fund
X-User-Id: {buyer-id}
X-Idempotency-Key: {unique-key}
```

**What Happens**:
- State: `CREATED` → `FUNDED`
- Ledger: `HOLD` entries created
- Money held in escrow

**What to Do**:
- Update your UI: "Payment received, waiting for delivery"
- Store funding timestamp

**Next**: Wait for seller to deliver

---

### 3. Deliver Deal

**When**: Seller confirms delivery/handover

```http
POST /api/deals/{deal-id}/deliver
X-User-Id: {seller-id}
X-Idempotency-Key: {unique-key}
```

**What Happens**:
- State: `FUNDED` → `DELIVERED` → `INSPECTION`
- Immediate amount released to seller (per template)
- `AUTO_APPROVE` timer starts

**Timer Duration** (varies by category):
- Used Car: 2-3 days
- Real Estate: 5-7 days

**What to Do**:
- Update your UI: "Item delivered, inspection period started"
- Show timer countdown (if displaying in your UI)
- Notify buyer: "You have X days to inspect"

**Next**: Buyer inspects (or auto-approve triggers)

---

### 4. Inspection Period

**What Happens**:
- Buyer can approve or raise issue
- `AUTO_APPROVE` timer counts down
- If timer expires: Auto-transition to `APPROVED`

**Polling Strategy**:
```http
GET /api/deals/{deal-id}
```

Check `state` field:
- `INSPECTION`: Still inspecting
- `APPROVED`: Auto-approved or manually approved
- `ISSUE`: Issue raised

**Alternative**: Use timeline to detect state changes

---

### 5. Approve Deal

**When**: Buyer confirms satisfaction

```http
POST /api/deals/{deal-id}/approve
X-User-Id: {buyer-id}
X-Idempotency-Key: {unique-key}
```

**What Happens**:
- State: `INSPECTION` → `APPROVED` → `SETTLED`
- Holdback released to seller
- Deal finalized

**What to Do**:
- Update your UI: "Deal completed"
- Mark your order as completed
- Release any held resources

**Next**: Deal is complete

---

### 6. Raise Issue (Alternative Path)

**When**: Buyer finds problems

```http
POST /api/deals/{deal-id}/issue
X-User-Id: {buyer-id}
X-Idempotency-Key: {unique-key}

{
  "reasonCode": "DAMAGE_MINOR",
  "freeText": "Scratch on driver side door",
  "evidenceIds": ["evidence-uuid-1"]
}
```

**What Happens**:
- State: `INSPECTION` → `ISSUE`
- `DISPUTE_TTL` timer starts (typically 14 days)
- Dispute case created

**What to Do**:
- Update your UI: "Issue raised, dispute resolution in progress"
- Show dispute TTL countdown
- Notify seller: "Buyer raised issue"

**Next**: Admin resolves or TTL expires

---

### 7. Settlement (After Issue)

**What Happens**:
- Admin resolves with constrained outcome
- OR TTL expires → default resolution applied
- State: `ISSUE` → `SETTLED`

**Resolution Types**:
- `releaseHoldbackMinusMinorCap`: OFFSET applied, rest released
- `fullRefund`: Full refund to buyer
- `partialRefund`: Partial refund
- `releaseHoldback`: Full release to seller

**What to Do**:
- Poll deal state until `SETTLED`
- Read timeline to see resolution details
- Update your UI with final outcome

---

## Reading the Truth

### Current State

```http
GET /api/deals/{deal-id}
```

**Use For**:
- Quick state check
- Display current status
- Simple polling

**Limitations**:
- Does not show full history
- Does not show ledger details

### Timeline (Source of Truth)

```http
GET /api/deals/{deal-id}/timeline
```

**Use For**:
- Complete audit trail
- Ledger reconstruction
- Dispute evidence
- State transition history

**Response Structure**:
```json
{
  "items": [
    {
      "type": "STATE_TRANSITION",
      "timestamp": "2026-02-01T10:00:00Z",
      "data": { "from": "CREATED", "to": "FUNDED" }
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
    },
    {
      "type": "EVIDENCE",
      "timestamp": "2026-02-01T11:00:00Z",
      "data": {
        "id": "evidence-uuid",
        "type": "PHOTO",
        "uri": "https://..."
      }
    }
  ]
}
```

**Best Practice**:
- Use timeline for reconciliation
- Use timeline for dispute evidence
- Use timeline for audit purposes

---

## Polling vs Webhooks

### Current: Polling (Recommended)

**Strategy**:
1. Poll deal state every 30-60 seconds during active periods
2. Poll timeline for complete history
3. Use idempotency keys for all mutations

**When to Poll**:
- After creating deal (wait for funding)
- After funding (wait for delivery)
- During inspection period (wait for approve/issue)
- During dispute (wait for resolution)

### Future: Webhooks (Optional)

If webhooks are implemented, they will emit:
- `deal.state.changed`
- `dispute.opened`
- `dispute.resolved`
- `ledger.entry.created`

**Until then**: Polling timeline is the source of truth.

---

## Error Recovery

### Network Errors

**Strategy**: Retry with same idempotency key

```python
def fund_deal(deal_id, buyer_id, max_retries=3):
    idempotency_key = f"fund-{deal_id}-{timestamp}"
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"/api/deals/{deal_id}/fund",
                headers={
                    "X-User-Id": buyer_id,
                    "X-Idempotency-Key": idempotency_key
                }
            )
            return response.json()
        except NetworkError:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise
```

### State Conflicts

**Example**: Trying to approve a deal that's already approved

**Strategy**:
- Check current state before mutation
- Handle 409 Conflict gracefully
- Read timeline to understand current state

---

## Integration Example (Pseudocode)

```python
class EscrowClient:
    def create_deal(self, buyer_id, seller_id, item_ref, category, amount):
        idempotency_key = self.generate_key("create", item_ref)
        response = self.post("/api/deals", {
            "buyerId": buyer_id,
            "sellerId": seller_id,
            "itemRef": item_ref,
            "category": category,
            "totalAmount": amount,
            "currency": "USD"
        }, idempotency_key)
        return response["data"]["id"]
    
    def fund_deal(self, deal_id, buyer_id):
        idempotency_key = self.generate_key("fund", deal_id)
        self.post(f"/api/deals/{deal_id}/fund", None, idempotency_key)
    
    def wait_for_settlement(self, deal_id, timeout=3600):
        start_time = time.time()
        while time.time() - start_time < timeout:
            deal = self.get(f"/api/deals/{deal_id}")
            if deal["state"] == "SETTLED":
                return deal
            time.sleep(30)  # Poll every 30 seconds
        raise TimeoutError("Deal not settled within timeout")
    
    def get_timeline(self, deal_id):
        return self.get(f"/api/deals/{deal_id}/timeline")
```

---

## Next Steps

1. **Partner Onboarding**: See `/docs/PARTNER_ONBOARDING.md`
2. **Webhooks & Idempotency**: See `/docs/WEBHOOKS_AND_IDEMPOTENCY.md`
3. **Demo Seed Guide**: See `/docs/DEMO_SEED_GUIDE.md`
