# Lemon Payment Strategy

**Purpose**: Define Lemon Squeezy integration strategy

## Lemon Squeezy Overview

Lemon Squeezy is a payment processor that handles:
- Subscription management
- One-time payments
- Webhook notifications
- Checkout link generation

## Product Mapping

### Partner Tier → Lemon Product Mapping

| Partner Tier | Monthly Price | Lemon Product ID | Features |
|-------------|---------------|------------------|----------|
| STARTER | ₩500,000 | `lemon_product_starter` | 10 deals/month, 1.5% per deal |
| PROFESSIONAL | ₩2,000,000 | `lemon_product_professional` | 50 deals/month, 1.2% per deal |
| ENTERPRISE | ₩5,000,000 | `lemon_product_enterprise` | Unlimited deals, 1.0% per deal |

### Pricing Model Mapping

- **PER_DEAL**: No subscription, pay per invoice (one-time payment)
- **SUBSCRIPTION**: Monthly subscription only
- **HYBRID**: Monthly subscription + per-deal fees (subscription + one-time)

## Checkout Flow

1. Partner views invoice in dashboard
2. Click "Pay Now" button
3. System generates Lemon Checkout Link
4. Partner redirected to Lemon checkout
5. Partner completes payment
6. Lemon sends webhook (payment_success)
7. System updates invoice status to PAID
8. System grants entitlement

## Webhook Events

### payment_success
- Triggered when payment is completed
- Contains: `order_id`, `customer_id`, `product_id`, `variant_id`, `total`, `status`
- Action: Update invoice to PAID, grant entitlement

### subscription_created
- Triggered when subscription is created
- Action: Record subscription, grant entitlement

### subscription_updated
- Triggered when subscription is updated
- Action: Update entitlement

### subscription_cancelled
- Triggered when subscription is cancelled
- Action: Revoke entitlement (at end of billing period)

## Idempotency

- All webhook handlers must be idempotent
- Check if invoice is already PAID before processing
- Check if entitlement already exists before granting
- Use Lemon order_id as idempotency key

## Security

- Verify webhook signature (Lemon provides HMAC signature)
- Only process webhooks from Lemon IPs (if possible)
- Store webhook events for audit trail
