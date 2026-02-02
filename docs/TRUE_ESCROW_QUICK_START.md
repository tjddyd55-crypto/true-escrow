# True Escrow Quick Start Guide

**Purpose**: Quick reference for setting up true-escrow repository  
**Date**: 2026-02-02

---

## Repository Structure

```
true-escrow/
├── server/          # Spring Boot backend
├── apps/web/       # Next.js frontend (optional)
├── docs/           # Documentation
└── Dockerfile      # Railway deployment
```

---

## Quick Setup (5 Steps)

### 1. Clone and Structure

```bash
git clone https://github.com/tjddyd55-crypto/true-escrow.git
cd true-escrow
mkdir -p server/{api,webhooks,services/{escrow,revenue,billing,entitlement},db/{migrations,schema}}
```

### 2. Copy Phase 1-10 Code

From `trust-escrow/src/main/java/com/trustescrow/`:

**Phase 1-7 (Escrow Core)**:
```bash
# Copy to server/services/escrow/
- domain/model/* (Deal, EscrowLedgerEntry, etc.)
- domain/service/* (RulesEngine, StateMachine, etc.)
- application/service/DealApplicationService
- application/job/* (AutoApproveJob, etc.)
```

**Phase 8 (Revenue)**:
```bash
# Copy to server/services/revenue/
- domain/model/RevenueLedgerEntry
- domain/service/RevenueLedgerRepository
- application/service/RevenueService
- application/service/SettledDealProcessor
```

**Phase 9 (Billing)**:
```bash
# Copy to server/services/billing/
- domain/model/{Partner, Invoice}
- domain/service/{PartnerRepository, InvoiceRepository}
- application/service/{PartnerOnboardingService, InvoiceService, PartnerDashboardService}
- presentation/controller/{PartnerController, InvoiceController}
```

**Phase 10 (Entitlement)**:
```bash
# Copy to server/services/entitlement/
- domain/model/{Entitlement, LemonProductMapping}
- domain/service/{EntitlementRepository, LemonProductMappingRepository}
- application/service/{LemonCheckoutService, LemonWebhookService, EntitlementService}
- presentation/controller/{LemonWebhookController, PaymentController}
```

### 3. Create Dockerfile

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

### 4. Configure Railway

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

**Environment Variables**:
```
DATABASE_URL=<from Railway PostgreSQL>
LEMON_API_KEY=<from Lemon Squeezy>
LEMON_STORE_ID=<from Lemon Squeezy>
LEMON_WEBHOOK_SECRET=<from Lemon Squeezy>
LEMON_WEBHOOK_URL=https://your-app.railway.app/api/webhooks/lemonsqueezy
APP_BASE_URL=https://your-app.railway.app
```

### 5. Deploy

1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL service
4. Set environment variables
5. Deploy!

---

## Verification

```bash
# Health check
curl https://your-app.railway.app/actuator/health

# Webhook endpoint
curl -X POST https://your-app.railway.app/api/webhooks/lemonsqueezy
```

---

## Key Files Checklist

- [ ] `Dockerfile`
- [ ] `railway.json`
- [ ] `.env.example`
- [ ] `server/build.gradle`
- [ ] `server/src/main/resources/application.yml`
- [ ] Database migrations (Flyway)
- [ ] All Phase 1-10 code copied

---

## Status

✅ **Quick Start Guide Complete**

Ready for implementation!
