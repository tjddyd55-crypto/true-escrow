# Payment Flow

**Purpose**: Define payment flow from invoice to entitlement

## Flow Diagram

```
Invoice (PENDING)
    ↓
Generate Lemon Checkout Link
    ↓
Partner clicks "Pay Now"
    ↓
Redirect to Lemon Checkout
    ↓
Partner completes payment
    ↓
Lemon sends webhook (payment_success)
    ↓
Verify webhook signature
    ↓
Update Invoice (PAID)
    ↓
Grant Entitlement
    ↓
Notify Partner
```

## Invoice → Lemon Checkout

### Checkout Link Generation

**Input**:
- Invoice ID
- Invoice amount
- Partner ID
- Product ID (based on partner tier)

**Process**:
1. Get partner tier
2. Map tier to Lemon product ID
3. Generate checkout link with:
   - Product ID
   - Variant ID (if applicable)
   - Custom price (invoice amount)
   - Success URL (webhook endpoint)
   - Customer email (partner email)

**Output**:
- Lemon Checkout URL

## Webhook Processing

### payment_success Webhook

**Payload**:
```json
{
  "meta": {
    "event_name": "order_created",
    "custom_data": {
      "invoice_id": "<uuid>"
    }
  },
  "data": {
    "id": "order_id",
    "attributes": {
      "status": "paid",
      "total": "2000000",
      "currency": "KRW",
      "customer_id": "customer_id",
      "product_id": "product_id"
    }
  }
}
```

**Processing**:
1. Verify webhook signature
2. Extract invoice_id from custom_data
3. Load invoice
4. Check if already PAID (idempotency)
5. Update invoice status to PAID
6. Record payment date
7. Grant entitlement
8. Log webhook event

## Error Handling

- Invalid signature → Reject webhook
- Invoice not found → Log error, return 404
- Invoice already PAID → Return 200 (idempotent)
- Payment amount mismatch → Log warning, still process
- Entitlement grant failure → Log error, retry

## Idempotency Keys

- Use Lemon order_id as idempotency key
- Store processed webhook IDs
- Check before processing each webhook
