# Code Migration Map: trust-escrow → true-escrow

**Purpose**: Exact file mapping for Phase 1-10 code migration  
**Date**: 2026-02-02

---

## Source: trust-escrow
## Target: true-escrow

---

## Phase 1-7: Escrow Core (SEALED)

### Domain Models
```
trust-escrow/src/main/java/com/trustescrow/domain/model/
  → true-escrow/server/services/escrow/domain/model/

Files:
- Deal.java
- DealState.java
- DealCategory.java
- EscrowLedgerEntry.java
- LedgerEntryType.java
- AuditEvent.java
- AuditEventType.java
- DisputeCase.java
- Timer.java
- ContractTemplate.java
- ContractInstance.java
- EvidenceMetadata.java
- EvidenceType.java
- IssueReasonCode.java
- Milestone.java
- Role.java
- ChecklistItem.java
- ChecklistItemStatus.java
```

### Domain Services
```
trust-escrow/src/main/java/com/trustescrow/domain/service/
  → true-escrow/server/services/escrow/domain/service/

Files:
- DealRepository.java
- EscrowLedgerRepository.java
- AuditEventRepository.java
- DisputeCaseRepository.java
- TimerRepository.java
- ContractTemplateRepository.java
- ContractInstanceRepository.java
- EvidenceRepository.java
- RulesEngineService.java
- StateMachine.java
- DealStateService.java
- EscrowLedgerService.java
- TimelineService.java
- TimerService.java
- CategoryTemplateService.java
- CategoryEvidenceService.java
- TemplateParserService.java
```

### Application Services
```
trust-escrow/src/main/java/com/trustescrow/application/service/
  → true-escrow/server/services/escrow/application/service/

Files:
- DealApplicationService.java
- CategoryTemplateInitializationService.java
```

### Jobs
```
trust-escrow/src/main/java/com/trustescrow/application/job/
  → true-escrow/server/services/escrow/application/job/

Files:
- AutoApproveJob.java
- DisputeTTLJob.java
- HoldbackReleaseJob.java
```

### Controllers
```
trust-escrow/src/main/java/com/trustescrow/presentation/controller/
  → true-escrow/server/api/escrow/

Files:
- DealController.java
- AdminController.java
```

### Rules Engine
```
trust-escrow/src/main/java/com/trustescrow/domain/rules/
  → true-escrow/server/services/escrow/domain/rules/

Files:
- RulesEngine.java
```

---

## Phase 8: Revenue Model

### Domain Models
```
trust-escrow/src/main/java/com/trustescrow/domain/model/
  → true-escrow/server/services/revenue/domain/model/

Files:
- RevenueLedgerEntry.java
```

### Repositories
```
trust-escrow/src/main/java/com/trustescrow/domain/service/
  → true-escrow/server/services/revenue/domain/service/

Files:
- RevenueLedgerRepository.java
```

### Services
```
trust-escrow/src/main/java/com/trustescrow/application/service/
  → true-escrow/server/services/revenue/application/service/

Files:
- RevenueService.java
- SettledDealProcessor.java
```

---

## Phase 9: First Paid Partner

### Domain Models
```
trust-escrow/src/main/java/com/trustescrow/domain/model/
  → true-escrow/server/services/billing/domain/model/

Files:
- Partner.java
- Invoice.java
```

### Repositories
```
trust-escrow/src/main/java/com/trustescrow/domain/service/
  → true-escrow/server/services/billing/domain/service/

Files:
- PartnerRepository.java
- InvoiceRepository.java
```

### Services
```
trust-escrow/src/main/java/com/trustescrow/application/service/
  → true-escrow/server/services/billing/application/service/

Files:
- PartnerOnboardingService.java
- InvoiceService.java
- PartnerDashboardService.java
```

### Controllers
```
trust-escrow/src/main/java/com/trustescrow/presentation/controller/
  → true-escrow/server/api/billing/

Files:
- PartnerController.java
- InvoiceController.java
```

### DTOs
```
trust-escrow/src/main/java/com/trustescrow/application/dto/
  → true-escrow/server/api/billing/dto/

Files:
- CreatePartnerRequest.java
- PartnerResponse.java
- BindPricingRequest.java
- DashboardOverviewResponse.java
- RevenueSummaryResponse.java
- InvoiceResponse.java
- ApiResponse.java
- DealResponse.java
```

---

## Phase 10: Automated Payment

### Domain Models
```
trust-escrow/src/main/java/com/trustescrow/domain/model/
  → true-escrow/server/services/entitlement/domain/model/

Files:
- Entitlement.java
- LemonProductMapping.java
```

### Repositories
```
trust-escrow/src/main/java/com/trustescrow/domain/service/
  → true-escrow/server/services/entitlement/domain/service/

Files:
- EntitlementRepository.java
- LemonProductMappingRepository.java
```

### Services
```
trust-escrow/src/main/java/com/trustescrow/application/service/
  → true-escrow/server/services/entitlement/application/service/

Files:
- LemonCheckoutService.java
- LemonWebhookService.java
- EntitlementService.java
```

### Controllers
```
trust-escrow/src/main/java/com/trustescrow/presentation/controller/
  → true-escrow/server/webhooks/lemonsqueezy/

Files:
- LemonWebhookController.java

trust-escrow/src/main/java/com/trustescrow/presentation/controller/
  → true-escrow/server/api/payment/

Files:
- PaymentController.java
```

---

## Configuration Files

### Application Configuration
```
trust-escrow/src/main/resources/
  → true-escrow/server/src/main/resources/

Files:
- application.yml
- application-pilot.yml (if needed)
```

### Build Configuration
```
trust-escrow/build.gradle
  → true-escrow/server/build.gradle

trust-escrow/settings.gradle
  → true-escrow/server/settings.gradle
```

---

## Database Migrations

### Create Migration Files
```
true-escrow/server/db/migrations/

Files to create:
- V1__create_escrow_core_tables.sql
- V2__create_audit_tables.sql
- V3__create_dispute_tables.sql
- V4__create_revenue_ledger.sql
- V5__create_partner_tables.sql
- V6__create_invoice_tables.sql
- V7__create_entitlement_tables.sql
- V8__create_lemon_product_mapping.sql
```

---

## Package Structure Changes

### From (trust-escrow)
```
com.trustescrow.domain.model.*
com.trustescrow.domain.service.*
com.trustescrow.application.service.*
com.trustescrow.presentation.controller.*
```

### To (true-escrow)
```
com.trueescrow.escrow.domain.model.*
com.trueescrow.escrow.domain.service.*
com.trueescrow.escrow.application.service.*
com.trueescrow.escrow.api.*

com.trueescrow.revenue.domain.model.*
com.trueescrow.revenue.domain.service.*
com.trueescrow.revenue.application.service.*

com.trueescrow.billing.domain.model.*
com.trueescrow.billing.domain.service.*
com.trueescrow.billing.application.service.*
com.trueescrow.billing.api.*

com.trueescrow.entitlement.domain.model.*
com.trueescrow.entitlement.domain.service.*
com.trueescrow.entitlement.application.service.*
com.trueescrow.entitlement.webhooks.*
```

---

## Migration Script (Bash)

```bash
#!/bin/bash

# Set source and target
SOURCE="trust-escrow/src/main/java/com/trustescrow"
TARGET="true-escrow/server"

# Phase 1-7: Escrow Core
cp -r $SOURCE/domain/model/* $TARGET/services/escrow/domain/model/
cp -r $SOURCE/domain/service/* $TARGET/services/escrow/domain/service/
cp -r $SOURCE/application/service/DealApplicationService.java $TARGET/services/escrow/application/service/
cp -r $SOURCE/application/job/* $TARGET/services/escrow/application/job/
cp -r $SOURCE/presentation/controller/{DealController,AdminController}.java $TARGET/api/escrow/
cp -r $SOURCE/domain/rules/* $TARGET/services/escrow/domain/rules/

# Phase 8: Revenue
cp -r $SOURCE/domain/model/RevenueLedgerEntry.java $TARGET/services/revenue/domain/model/
cp -r $SOURCE/domain/service/RevenueLedgerRepository.java $TARGET/services/revenue/domain/service/
cp -r $SOURCE/application/service/{RevenueService,SettledDealProcessor}.java $TARGET/services/revenue/application/service/

# Phase 9: Billing
cp -r $SOURCE/domain/model/{Partner,Invoice}.java $TARGET/services/billing/domain/model/
cp -r $SOURCE/domain/service/{PartnerRepository,InvoiceRepository}.java $TARGET/services/billing/domain/service/
cp -r $SOURCE/application/service/{PartnerOnboardingService,InvoiceService,PartnerDashboardService}.java $TARGET/services/billing/application/service/
cp -r $SOURCE/presentation/controller/{PartnerController,InvoiceController}.java $TARGET/api/billing/

# Phase 10: Entitlement
cp -r $SOURCE/domain/model/{Entitlement,LemonProductMapping}.java $TARGET/services/entitlement/domain/model/
cp -r $SOURCE/domain/service/{EntitlementRepository,LemonProductMappingRepository}.java $TARGET/services/entitlement/domain/service/
cp -r $SOURCE/application/service/{LemonCheckoutService,LemonWebhookService,EntitlementService}.java $TARGET/services/entitlement/application/service/
cp -r $SOURCE/presentation/controller/LemonWebhookController.java $TARGET/webhooks/lemonsqueezy/
cp -r $SOURCE/presentation/controller/PaymentController.java $TARGET/api/payment/

# Configuration
cp -r trust-escrow/src/main/resources/* $TARGET/src/main/resources/
cp trust-escrow/build.gradle $TARGET/
cp trust-escrow/settings.gradle $TARGET/
```

---

## Status

✅ **Code Migration Map Complete**

Ready for code migration to true-escrow repository.
