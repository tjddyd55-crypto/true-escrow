# True Escrow Implementation Checklist

**Purpose**: Step-by-step checklist for implementing Phase 1-10 in true-escrow  
**Date**: 2026-02-02

---

## Pre-Implementation

- [ ] Clone true-escrow repository
- [ ] Create directory structure
- [ ] Set up build configuration (build.gradle)
- [ ] Configure database connection

---

## Phase 1-7: Escrow Core (SEALED)

### Entities
- [ ] `Deal.java` - Deal lifecycle
- [ ] `DealState.java` - State enum
- [ ] `DealCategory.java` - Category enum
- [ ] `EscrowLedgerEntry.java` - Escrow ledger
- [ ] `AuditEvent.java` - Audit trail
- [ ] `DisputeCase.java` - Dispute handling
- [ ] `Timer.java` - Timer system
- [ ] `ContractTemplate.java` - Contract templates
- [ ] `ContractInstance.java` - Contract instances

### Services
- [ ] `DealApplicationService.java` - Deal operations
- [ ] `RulesEngineService.java` - Rules engine
- [ ] `StateMachine.java` - State transitions
- [ ] `EscrowLedgerService.java` - Ledger operations
- [ ] `TimelineService.java` - Timeline generation
- [ ] `DealStateService.java` - State management

### Jobs
- [ ] `AutoApproveJob.java` - Auto-approve timer
- [ ] `DisputeTTLJob.java` - Dispute TTL timer
- [ ] `HoldbackReleaseJob.java` - Holdback release

### Controllers
- [ ] `DealController.java` - Deal API
- [ ] `AdminController.java` - Admin API

**Location**: `server/services/escrow/`

**Verification**: Escrow Core is SEALED (no modifications)

---

## Phase 8: Revenue Model

### Entities
- [ ] `RevenueLedgerEntry.java` - Revenue ledger
- [ ] `RevenueLedgerEntryType.java` - Entry type enum

### Repositories
- [ ] `RevenueLedgerRepository.java`

### Services
- [ ] `RevenueService.java` - Revenue processing
- [ ] `SettledDealProcessor.java` - SETTLED event listener

**Location**: `server/services/revenue/`

**Verification**: 
- [ ] Revenue Ledger separate from Escrow Ledger
- [ ] Revenue only references Escrow events
- [ ] Fee calculation works

---

## Phase 9: First Paid Partner

### Entities
- [ ] `Partner.java` - Partner entity
- [ ] `Invoice.java` - Invoice entity
- [ ] `InvoiceStatus.java` - Invoice status enum

### Repositories
- [ ] `PartnerRepository.java`
- [ ] `InvoiceRepository.java`

### Services
- [ ] `PartnerOnboardingService.java` - Partner onboarding
- [ ] `InvoiceService.java` - Invoice generation
- [ ] `PartnerDashboardService.java` - Dashboard data

### Controllers
- [ ] `PartnerController.java` - Partner API
- [ ] `InvoiceController.java` - Invoice API

**Location**: 
- Entities: `server/services/billing/`
- Services: `server/services/billing/`
- Controllers: `server/api/`

**Verification**:
- [ ] Partner creation works
- [ ] Invoice generation works
- [ ] Dashboard accessible

---

## Phase 10: Automated Payment

### Entities
- [ ] `Entitlement.java` - Entitlement entity
- [ ] `LemonProductMapping.java` - Product mapping
- [ ] `EntitlementType.java` - Entitlement type enum
- [ ] `EntitlementStatus.java` - Entitlement status enum

### Repositories
- [ ] `EntitlementRepository.java`
- [ ] `LemonProductMappingRepository.java`

### Services
- [ ] `LemonCheckoutService.java` - Checkout link generation
- [ ] `LemonWebhookService.java` - Webhook processing
- [ ] `EntitlementService.java` - Entitlement management

### Controllers
- [ ] `LemonWebhookController.java` - Webhook endpoint
- [ ] `PaymentController.java` - Payment API

**Location**:
- Entities: `server/services/entitlement/`
- Services: `server/services/entitlement/`
- Controllers: `server/webhooks/lemonsqueezy/`

**Verification**:
- [ ] Checkout link generation works
- [ ] Webhook endpoint returns 200 OK
- [ ] Invoice auto-PAID on payment
- [ ] Entitlement granted automatically
- [ ] Dashboard access controlled

---

## Database Migrations

### Phase 1-7
- [ ] `V1__create_escrow_core_tables.sql`
- [ ] `V2__create_audit_tables.sql`
- [ ] `V3__create_dispute_tables.sql`

### Phase 8
- [ ] `V4__create_revenue_ledger.sql`

### Phase 9
- [ ] `V5__create_partner_tables.sql`
- [ ] `V6__create_invoice_tables.sql`

### Phase 10
- [ ] `V7__create_entitlement_tables.sql`
- [ ] `V8__create_lemon_product_mapping.sql`

---

## Configuration

### application.yml
- [ ] Database configuration
- [ ] Lemon Squeezy configuration
- [ ] Webhook URL configuration
- [ ] Railway-specific settings

### Environment Variables
- [ ] `DATABASE_URL`
- [ ] `LEMON_API_KEY`
- [ ] `LEMON_STORE_ID`
- [ ] `LEMON_WEBHOOK_SECRET`
- [ ] `LEMON_WEBHOOK_URL`
- [ ] `APP_BASE_URL`

---

## Railway Deployment

### Files
- [ ] `Dockerfile` - Container build
- [ ] `railway.json` - Railway configuration
- [ ] `.env.example` - Environment template
- [ ] `.dockerignore` - Docker ignore

### Verification
- [ ] Builds locally with Docker
- [ ] Deploys to Railway
- [ ] External URL accessible
- [ ] Database connection works
- [ ] Webhook endpoint accessible

---

## Testing

### Local Testing
- [ ] Build: `./gradlew build`
- [ ] Run: `./gradlew bootRun`
- [ ] API endpoints respond
- [ ] Webhook endpoint returns 200

### Railway Testing
- [ ] Deploy to Railway
- [ ] Verify external URL
- [ ] Test webhook endpoint
- [ ] Test Lemon checkout link generation

### Payment Testing
- [ ] Create partner
- [ ] Generate invoice
- [ ] Generate checkout link
- [ ] Complete test payment
- [ ] Verify webhook received
- [ ] Verify invoice PAID
- [ ] Verify entitlement granted

---

## Documentation

- [ ] `README.md` - Project overview
- [ ] `docs/DEPLOYMENT.md` - Deployment guide
- [ ] `docs/API.md` - API documentation
- [ ] `docs/WEBHOOKS.md` - Webhook documentation
- [ ] `.env.example` - Environment variables

---

## Final Verification

- [ ] All Phase 1-10 components implemented
- [ ] Repository builds and runs
- [ ] Railway deployment works
- [ ] Webhook endpoint accessible
- [ ] Ready for first payment test

---

## Status

**Total Items**: 100+
**Completed**: ___
**Remaining**: ___

**Ready for**: [ ] Local Testing [ ] Railway Deploy [ ] Payment Test
