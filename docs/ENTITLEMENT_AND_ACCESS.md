# Entitlement and Access Control

**Purpose**: Define entitlement system for partner access control

## Entitlement Model

### Entitlement States

- **ACTIVE**: Partner has active subscription/paid invoice
- **EXPIRED**: Entitlement period ended, no renewal
- **SUSPENDED**: Manually suspended (admin action)
- **CANCELLED**: Subscription cancelled, expires at end of period

### Entitlement Types

- **SUBSCRIPTION**: Based on active subscription
- **INVOICE_BASED**: Based on paid invoice (one-time or monthly)

## Entitlement Lifecycle

### Activation

1. Invoice marked as PAID
2. Check partner tier
3. Calculate entitlement period:
   - Subscription: Next billing date
   - One-time: 30 days from payment (or invoice period)
4. Create/update entitlement
5. Set status to ACTIVE

### Expiration

1. Scheduled job checks expiring entitlements
2. If no renewal payment, set status to EXPIRED
3. Revoke dashboard access
4. Notify partner

### Renewal

1. New invoice generated
2. Partner pays invoice
3. Webhook triggers entitlement renewal
4. Extend entitlement period
5. Keep status ACTIVE

## Access Control

### Dashboard Access

- Check entitlement status
- ACTIVE → Allow access
- EXPIRED/SUSPENDED/CANCELLED → Deny access

### API Access

- Same entitlement check
- Return 403 Forbidden if no active entitlement

## Entitlement Data Model

```
Entitlement
- id
- partnerId
- type (SUBSCRIPTION, INVOICE_BASED)
- status (ACTIVE, EXPIRED, SUSPENDED, CANCELLED)
- startDate
- endDate
- invoiceId (for invoice-based)
- subscriptionId (for subscription-based)
- createdAt
- updatedAt
```

## Scheduled Jobs

### Expiration Check

- Run daily
- Find entitlements where endDate < now and status = ACTIVE
- Set status to EXPIRED
- Revoke access

### Renewal Reminder

- Run 7 days before expiration
- Send email to partner
- Show reminder in dashboard
