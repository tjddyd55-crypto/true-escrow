# True Escrow Bootstrap Guide

**Purpose**: Guide for setting up true-escrow repository to Phase 10 complete state  
**Date**: 2026-02-02

---

## Repository Structure

```
true-escrow/
├── apps/
│   └── web/                    # Partner Dashboard (Next.js)
│       ├── package.json
│       ├── next.config.js
│       ├── src/
│       └── public/
│
├── server/
│   ├── api/                     # REST API Controllers
│   │   └── ...
│   ├── webhooks/                # Webhook Handlers
│   │   └── lemonsqueezy/
│   ├── services/
│   │   ├── escrow/              # (SEALED - Phase 1-7)
│   │   ├── revenue/             # Phase 8
│   │   ├── billing/             # Phase 9
│   │   └── entitlement/         # Phase 10
│   ├── db/
│   │   ├── migrations/
│   │   └── schema/
│   ├── build.gradle
│   ├── src/main/java/
│   └── src/main/resources/
│
├── docs/
│   ├── PHASE_8_*.md
│   ├── PHASE_9_*.md
│   ├── PHASE_10_*.md
│   └── DEPLOYMENT.md
│
├── dev_task/
│   └── (Phase 8-10 task references)
│
├── Dockerfile
├── railway.json
├── .env.example
└── README.md
```

---

## Phase Implementation Checklist

### Phase 1-7: Escrow Core (SEALED)

**Status**: ✅ Already implemented in trust-escrow

**Components**:
- Deal lifecycle (CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED)
- Rules Engine (state machine, transitions)
- Escrow Ledger (append-only)
- Dispute handling
- Timer system (AUTO_APPROVE, DISPUTE_TTL, HOLDBACK_RELEASE)
- Admin constraints

**Location**: `server/services/escrow/`

**CRITICAL**: No modifications allowed to Escrow Core.

---

### Phase 8: Monetization Model

**Status**: ✅ Implemented in trust-escrow

**Components to Copy**:
- `RevenueLedgerEntry` entity
- `RevenueLedgerRepository`
- `RevenueService`
- `PricingModel` enum (PER_DEAL, SUBSCRIPTION, HYBRID)
- `SubscriptionTier` enum (STARTER, PROFESSIONAL, ENTERPRISE)

**Location**: `server/services/revenue/`

**Key Rules**:
- Revenue Ledger ≠ Escrow Ledger (separate tables)
- Revenue only references Escrow events (no direct account access)
- Fee calculation based on settlement events

---

### Phase 9: First Paid Partner

**Status**: ✅ Implemented in trust-escrow

**Components to Copy**:
- `Partner` entity
- `Invoice` entity
- `PartnerOnboardingService`
- `InvoiceService`
- `PartnerDashboardService`
- `PartnerController`
- `InvoiceController`

**Location**: 
- Entities: `server/services/billing/`
- Services: `server/services/billing/`
- Controllers: `server/api/`

**Key Features**:
- Partner creation and onboarding
- Monthly invoice generation
- Invoice states: PENDING → SENT → PAID
- Read-only Partner Dashboard

---

### Phase 10: Automated Payment

**Status**: ✅ Implemented in trust-escrow

**Components to Copy**:
- `Entitlement` entity
- `LemonProductMapping` entity
- `LemonCheckoutService`
- `LemonWebhookService`
- `EntitlementService`
- `LemonWebhookController`
- `PaymentController`

**Location**:
- Entities: `server/services/entitlement/`
- Services: `server/services/entitlement/`
- Controllers: `server/webhooks/lemonsqueezy/`

**Key Features**:
- Lemon Squeezy checkout link generation
- Webhook handling (idempotent)
- Automatic invoice PAID status
- Entitlement management (ACTIVE/EXPIRED)
- Dashboard access control

---

## Database Schema

### Escrow Core Tables (Phase 1-7)
- `deals`
- `escrow_ledger_entries`
- `audit_events`
- `dispute_cases`
- `timers`
- `contract_templates`
- `contract_instances`

### Revenue Tables (Phase 8)
- `revenue_ledger_entries` (separate from escrow_ledger_entries)

### Billing Tables (Phase 9)
- `partners`
- `invoices`

### Entitlement Tables (Phase 10)
- `entitlements`
- `lemon_product_mappings`

---

## Railway Deployment Setup

### 1. Dockerfile

```dockerfile
FROM gradle:7.6-jdk17 AS build
WORKDIR /app
COPY server/build.gradle server/settings.gradle ./
COPY server/src ./src
RUN gradle build --no-daemon -x test

FROM openjdk:17-jre-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "java -jar app.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Lemon Squeezy
LEMON_API_KEY=your_api_key
LEMON_STORE_ID=your_store_id
LEMON_WEBHOOK_SECRET=your_webhook_secret
LEMON_WEBHOOK_URL=https://your-app.railway.app/api/webhooks/lemonsqueezy

# Application
APP_BASE_URL=https://your-app.railway.app
SPRING_PROFILES_ACTIVE=production
```

---

## Implementation Steps

### Step 1: Repository Setup

1. Clone true-escrow repository
2. Create directory structure:
   ```
   mkdir -p apps/web server/api server/webhooks server/services/{escrow,revenue,billing,entitlement} server/db/{migrations,schema} docs dev_task
   ```

### Step 2: Copy Escrow Core (Phase 1-7)

From `trust-escrow/src/main/java/com/trustescrow/domain/`:
- Copy all model entities (Deal, EscrowLedgerEntry, etc.)
- Copy all domain services (RulesEngine, StateMachine, etc.)
- Copy all repositories

To `true-escrow/server/services/escrow/`

**Verify**: Escrow Core is SEALED (no modifications)

### Step 3: Implement Phase 8 (Revenue)

From `trust-escrow/src/main/java/com/trustescrow/`:
- Copy `RevenueLedgerEntry`
- Copy `RevenueLedgerRepository`
- Copy `RevenueService`
- Copy `SettledDealProcessor`

To `true-escrow/server/services/revenue/`

**Verify**: Revenue Ledger is separate from Escrow Ledger

### Step 4: Implement Phase 9 (Billing)

From `trust-escrow/src/main/java/com/trustescrow/`:
- Copy `Partner`, `Invoice` entities
- Copy `PartnerOnboardingService`, `InvoiceService`
- Copy `PartnerDashboardService`
- Copy `PartnerController`, `InvoiceController`

To `true-escrow/server/services/billing/` and `server/api/`

**Verify**: Invoice generation and Partner Dashboard work

### Step 5: Implement Phase 10 (Entitlement)

From `trust-escrow/src/main/java/com/trustescrow/`:
- Copy `Entitlement`, `LemonProductMapping` entities
- Copy `LemonCheckoutService`, `LemonWebhookService`
- Copy `EntitlementService`
- Copy `LemonWebhookController`, `PaymentController`

To `true-escrow/server/services/entitlement/` and `server/webhooks/lemonsqueezy/`

**Verify**: Webhook endpoint returns 200 OK

### Step 6: Database Migrations

Create Flyway migrations for:
- Phase 1-7: Escrow Core tables
- Phase 8: Revenue tables
- Phase 9: Billing tables
- Phase 10: Entitlement tables

### Step 7: Configuration

1. Update `application.yml` with Railway settings
2. Add Lemon configuration
3. Set up environment variables

### Step 8: Testing

1. Local build: `./gradlew build`
2. Local run: `./gradlew bootRun`
3. Railway deploy: Push to repository
4. Webhook test: Send test webhook to `/api/webhooks/lemonsqueezy`

---

## Verification Checklist

- [ ] Repository builds locally
- [ ] All Phase 8-10 components copied
- [ ] Database migrations created
- [ ] Railway deployment configured
- [ ] Environment variables documented
- [ ] Webhook endpoint accessible
- [ ] Lemon checkout link generation works
- [ ] Entitlement system functional

---

## Next Steps After Bootstrap

1. **First Payment Test**: Create partner, generate invoice, test Lemon checkout
2. **Webhook Testing**: Use Lemon webhook testing tool
3. **Monitoring**: Set up logging and monitoring
4. **Documentation**: Complete API documentation

---

## Files to Create

1. `Dockerfile` - Railway deployment
2. `railway.json` - Railway configuration
3. `.env.example` - Environment variable template
4. `README.md` - Project overview
5. `docs/DEPLOYMENT.md` - Deployment guide
6. Database migration files (Flyway)

---

## Status

✅ **Bootstrap Guide Complete**

Ready for implementation in true-escrow repository.
