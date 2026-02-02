# Phase 9 Checklist

**Purpose**: Verify Phase 9 implementation completeness  
**Date**: 2026-02-01

---

## Revenue Service

- [ ] RevenueLedgerEntry entity exists
- [ ] RevenueLedgerRepository exists with required methods
- [ ] RevenueService.processSettledDeal() works
- [ ] Fee calculation follows Phase 8 pricing model
- [ ] Idempotency check (no duplicate entries)
- [ ] Revenue entries never reference escrow accounts
- [ ] SettledDealProcessor scheduled job runs

**Test**:
1. Create a deal and settle it
2. Verify Revenue Ledger entry created
3. Verify fee calculated correctly
4. Verify no duplicate entries on retry

---

## Revenue Ledger

- [ ] Separate table from Escrow Ledger
- [ ] Append-only (no updates, only inserts)
- [ ] Full audit trail (id, timestamp, partnerId, dealId, amount)
- [ ] References deals (no direct account references)
- [ ] Indexes on dealId, partnerId, createdAt, invoiceId

**Test**:
1. Verify table structure
2. Verify no foreign key to escrow accounts
3. Verify indexes exist

---

## Invoice Service

- [ ] Invoice entity exists
- [ ] InvoiceRepository exists with required methods
- [ ] InvoiceService.generateMonthlyInvoices() works
- [ ] Invoice contains correct line items
- [ ] Invoice states transition (PENDING → SENT → PAID)
- [ ] Manual payment marking works (markAsPaid)
- [ ] Invoice accessible via API

**Test**:
1. Generate invoice for partner with revenue entries
2. Verify invoice contains correct totals
3. Verify revenue entries linked to invoice
4. Mark invoice as sent
5. Mark invoice as paid

---

## Partner Onboarding

- [ ] Partner entity exists
- [ ] PartnerRepository exists
- [ ] PartnerOnboardingService.createPartner() works
- [ ] Pricing model can be bound
- [ ] Contract agreement can be recorded
- [ ] Dashboard token generated
- [ ] Partner accessible via API

**Test**:
1. Create partner via API
2. Bind pricing model
3. Record contract agreement
4. Verify dashboard token generated

---

## Partner Dashboard

- [ ] PartnerDashboardService.getOverview() works
- [ ] PartnerDashboardService.getPartnerDeals() works
- [ ] PartnerDashboardService.getRevenueSummary() works
- [ ] PartnerDashboardService.getPartnerInvoices() works
- [ ] PartnerController endpoints exist
- [ ] Token-based authentication works
- [ ] All data is read-only
- [ ] No Escrow internals exposed

**Test**:
1. Get dashboard overview
2. Get partner deals
3. Get revenue summary
4. Get invoices
5. Verify token validation works
6. Verify no admin actions available

---

## API Endpoints

- [ ] POST /api/partners (create partner)
- [ ] GET /api/partners/{partnerId} (get partner)
- [ ] PUT /api/partners/{partnerId}/pricing (bind pricing)
- [ ] POST /api/partners/{partnerId}/contract/agree (record agreement)
- [ ] GET /api/partners/{partnerId}/dashboard/overview (overview)
- [ ] GET /api/partners/{partnerId}/deals (deals list)
- [ ] GET /api/partners/{partnerId}/revenue/summary (revenue)
- [ ] GET /api/partners/{partnerId}/invoices (invoices)
- [ ] POST /api/invoices/generate (generate invoices)
- [ ] GET /api/invoices/{invoiceId} (get invoice)
- [ ] POST /api/invoices/{invoiceId}/mark-sent (mark sent)
- [ ] POST /api/invoices/{invoiceId}/mark-paid (mark paid)

**Test**:
1. Test all endpoints
2. Verify authentication where required
3. Verify response formats

---

## Escrow Core Compliance

- [ ] No Escrow Core modifications
- [ ] No Escrow Ledger modifications
- [ ] No Deal state machine changes
- [ ] No Rules Engine changes
- [ ] Revenue Service only reads from Escrow (does not modify)

**Test**:
1. Verify no changes to Escrow entities
2. Verify no changes to Escrow services
3. Verify Revenue Service does not modify Escrow

---

## Revenue Separation

- [ ] Revenue Ledger separate from Escrow Ledger
- [ ] Revenue entries never reference Escrow accounts
- [ ] Full audit trail exists
- [ ] Revenue queries independent from Escrow queries

**Test**:
1. Verify table separation
2. Verify no foreign keys to escrow accounts
3. Verify queries are independent

---

## First Paid Partner Readiness

- [ ] Partner can be created (1+ partners)
- [ ] Deal can be settled (1+ deals)
- [ ] Revenue recorded (1+ Revenue Ledger entries)
- [ ] Invoice generated (1+ invoices)
- [ ] Dashboard accessible

**Test**:
1. Create partner
2. Create and settle deal
3. Verify revenue entry created
4. Generate invoice
5. Access dashboard

---

## Documentation

- [ ] Phase 9 overview documented
- [ ] Revenue Service spec documented
- [ ] Invoice flow documented
- [ ] Partner onboarding flow documented
- [ ] Dashboard MVP spec documented
- [ ] Acceptance criteria documented

---

## Summary

**Total Items**: 50+
**Completed**: ___
**Remaining**: ___

**Status**: [ ] PASS [ ] FAIL

**Notes**:
- 
