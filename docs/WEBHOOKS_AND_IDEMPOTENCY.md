# Webhooks & Idempotency

**Purpose**: Ensure safe retries and real-time updates  
**Critical**: Idempotency is **required** for all mutations

---

## Idempotency (Required)

### Why Idempotency Matters

**Problem**: Network errors, timeouts, and retries can cause duplicate operations.

**Example**:
1. Client sends `POST /api/deals/{id}/fund`
2. Network timeout before response received
3. Client retries with same request
4. **Without idempotency**: Two funding operations (duplicate ledger entries)
5. **With idempotency**: Second request returns same result (no duplicate)

### Client-Generated Keys

**Format**: `{partner-id}-{operation}-{timestamp}-{random}`

**Examples**:
```
partner-123-fund-20260201100000-abc123
partner-123-deliver-20260201100001-def456
partner-123-approve-20260201100002-ghi789
```

**Rules**:
- Must be unique per operation
- Must be included in `X-Idempotency-Key` header
- Store in your database for retry tracking

### Implementation

```http
POST /api/deals/{deal-id}/fund
X-User-Id: {buyer-id}
X-Idempotency-Key: partner-123-fund-20260201100000-abc123
```

**Server Behavior**:
- First request with key: Process normally, store result
- Retry with same key: Return stored result (no duplicate processing)
- Different request with same key: Return 409 Conflict

### Retry Strategy

```python
def fund_deal_with_retry(deal_id, buyer_id, max_retries=3):
    idempotency_key = f"partner-123-fund-{deal_id}-{int(time.time())}-{random_string()}"
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"/api/deals/{deal_id}/fund",
                headers={
                    "X-User-Id": buyer_id,
                    "X-Idempotency-Key": idempotency_key
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 409:
                # Idempotency conflict - key already used for different request
                raise IdempotencyConflictError()
            else:
                response.raise_for_status()
                
        except (requests.Timeout, requests.ConnectionError) as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise RetryExhaustedError() from e
```

### Idempotency Key Storage

**Best Practice**: Store keys in your database

```sql
CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    operation VARCHAR(50),
    deal_id UUID,
    response JSONB,
    created_at TIMESTAMP
);
```

**Usage**:
1. Before API call: Check if key exists
2. If exists: Return stored response (no API call)
3. If not: Make API call, store response
4. On retry: Return stored response

---

## Webhooks (Optional / Future)

**Status**: Webhooks are **not yet implemented**. Use polling for now.

### Planned Webhook Events

When implemented, webhooks will emit:

#### 1. Deal State Changed

```json
{
  "event": "deal.state.changed",
  "dealId": "uuid",
  "timestamp": "2026-02-01T10:00:00Z",
  "data": {
    "from": "CREATED",
    "to": "FUNDED",
    "actor": "buyer-user-id"
  }
}
```

#### 2. Dispute Opened

```json
{
  "event": "dispute.opened",
  "dealId": "uuid",
  "disputeId": "uuid",
  "timestamp": "2026-02-01T11:00:00Z",
  "data": {
    "reasonCode": "DAMAGE_MINOR",
    "evidenceIds": ["uuid-1", "uuid-2"]
  }
}
```

#### 3. Dispute Resolved

```json
{
  "event": "dispute.resolved",
  "dealId": "uuid",
  "disputeId": "uuid",
  "timestamp": "2026-02-01T12:00:00Z",
  "data": {
    "outcome": "releaseHoldbackMinusMinorCap",
    "auditReason": "Minor damage confirmed, applying offset"
  }
}
```

#### 4. Ledger Entry Created

```json
{
  "event": "ledger.entry.created",
  "dealId": "uuid",
  "timestamp": "2026-02-01T10:00:05Z",
  "data": {
    "type": "HOLD",
    "amount": 10000.00,
    "fromAccount": "buyer",
    "toAccount": "escrow"
  }
}
```

### Webhook Security (When Implemented)

**Expected**:
- Webhook signature verification
- HTTPS endpoints only
- Retry mechanism for failed deliveries

**Until Then**: Poll timeline for updates

---

## Current: Polling Timeline (Recommended)

### Why Polling?

Until webhooks are implemented, **polling timeline is the source of truth**.

### Polling Strategy

**Frequency**:
- Active deals: Every 30-60 seconds
- Inactive deals: Every 5 minutes
- Settled deals: Stop polling

**Implementation**:

```python
def poll_deal_updates(deal_id, last_timestamp=None):
    timeline = client.get(f"/api/deals/{deal_id}/timeline")
    
    new_items = []
    if last_timestamp:
        new_items = [
            item for item in timeline["items"]
            if item["timestamp"] > last_timestamp
        ]
    else:
        new_items = timeline["items"]
    
    # Process new items
    for item in new_items:
        if item["type"] == "STATE_TRANSITION":
            handle_state_change(item["data"])
        elif item["type"] == "LEDGER_ENTRY":
            handle_ledger_entry(item["data"])
        elif item["type"] == "EVIDENCE":
            handle_evidence(item["data"])
    
    # Update last timestamp
    if new_items:
        last_timestamp = new_items[-1]["timestamp"]
    
    return last_timestamp
```

### Polling Best Practices

1. **Store Last Timestamp**: Only fetch new items
2. **Exponential Backoff**: On errors, back off gradually
3. **Idempotent Processing**: Process same item multiple times safely
4. **Error Handling**: Log errors, continue polling

---

## Idempotency Examples

### Example 1: Network Timeout

```python
# First attempt
try:
    response = fund_deal(deal_id, buyer_id, idempotency_key)
except TimeoutError:
    # Network timeout - retry with same key
    response = fund_deal(deal_id, buyer_id, idempotency_key)  # Same key!
    # Server returns cached result (no duplicate)
```

### Example 2: Duplicate Prevention

```python
# Request 1
fund_deal(deal_id, buyer_id, "key-123")
# Returns: { "success": true, "data": { "state": "FUNDED" } }

# Request 2 (retry with same key)
fund_deal(deal_id, buyer_id, "key-123")
# Returns: { "success": true, "data": { "state": "FUNDED" } }  # Same result, no duplicate
```

### Example 3: Key Conflict

```python
# Request 1: Fund deal A
fund_deal(deal_a_id, buyer_id, "key-123")
# Returns: Success

# Request 2: Fund deal B with same key (ERROR)
fund_deal(deal_b_id, buyer_id, "key-123")
# Returns: 409 Conflict (key already used for different operation)
```

---

## Testing Idempotency

### Test Case 1: Retry Same Request

```python
def test_retry_same_request():
    key = "test-fund-123"
    
    # First request
    response1 = fund_deal(deal_id, buyer_id, key)
    
    # Retry (simulate network error)
    response2 = fund_deal(deal_id, buyer_id, key)
    
    assert response1 == response2  # Same result
    assert get_ledger_entries(deal_id).count("HOLD") == 1  # No duplicate
```

### Test Case 2: Different Request Same Key

```python
def test_key_conflict():
    key = "test-key-123"
    
    # Request 1
    fund_deal(deal_a_id, buyer_id, key)
    
    # Request 2 with different deal (should fail)
    with pytest.raises(IdempotencyConflictError):
        fund_deal(deal_b_id, buyer_id, key)
```

---

## Summary

### Idempotency (Required)
- ✅ Always include `X-Idempotency-Key` header
- ✅ Generate unique keys per operation
- ✅ Retry with same key on network errors
- ✅ Store keys for tracking

### Webhooks (Future)
- ⏳ Not yet implemented
- ⏳ Use polling timeline for now
- ⏳ Will emit: state changes, disputes, ledger entries

### Polling (Current)
- ✅ Poll timeline for updates
- ✅ Store last timestamp
- ✅ Process new items idempotently

---

## Next Steps

1. **API Consumer Flow**: See `/docs/API_CONSUMER_FLOW.md`
2. **Partner Onboarding**: See `/docs/PARTNER_ONBOARDING.md`
3. **Demo Seed Guide**: See `/docs/DEMO_SEED_GUIDE.md`
