# Demo Seed Guide

**Purpose**: Generate demo-ready deals for partner demonstrations  
**Duration**: < 3 minutes  
**Prerequisites**: Backend running, templates initialized

---

## Quick Start

### Option 1: Automatic Seeding (Recommended)

Run backend with `demo` profile:

```bash
cd D:\workspace\trust-escrow
./gradlew bootRun --args='--spring.profiles.active=demo'
```

The `DemoSeedService` will automatically create:
- Used Car Happy Path Deal (INSPECTION state)
- Used Car Issue Deal (ISSUE state)
- Real Estate Doc Mismatch Deal (ISSUE state)

### Option 2: Manual API Calls

If you prefer manual control, use the following curl commands:

#### 1. Create Used Car Happy Path Deal

```bash
# Create deal
DEAL_ID=$(curl -X POST http://localhost:8080/api/deals \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "buyerId": "00000000-0000-0000-0000-000000000001",
    "sellerId": "00000000-0000-0000-0000-000000000002",
    "itemRef": "DEMO-UC-HAPPY-001",
    "category": "USED_CAR_PRIVATE",
    "totalAmount": 10000.00,
    "currency": "USD"
  }' | jq -r '.data.id')

# Fund deal
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/fund \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"

# Deliver (moves to INSPECTION)
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/deliver \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000002"

# Add evidence (if evidence upload endpoint exists)
# Note: Evidence metadata is typically created via deliver endpoint
```

#### 2. Create Used Car Issue Deal

```bash
# Create deal
DEAL_ID=$(curl -X POST http://localhost:8080/api/deals \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "buyerId": "00000000-0000-0000-0000-000000000001",
    "sellerId": "00000000-0000-0000-0000-000000000002",
    "itemRef": "DEMO-UC-ISSUE-001",
    "category": "USED_CAR_PRIVATE",
    "totalAmount": 15000.00,
    "currency": "USD"
  }' | jq -r '.data.id')

# Fund
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/fund \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"

# Deliver
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/deliver \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000002"

# Raise issue (requires evidence ID - get from evidence upload)
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/issue \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "reasonCode": "DAMAGE_MINOR",
    "freeText": "Minor scratch on driver side door",
    "evidenceIds": ["<evidence-id-from-upload>"]
  }'
```

#### 3. Create Real Estate Doc Mismatch Deal

```bash
# Create deal
DEAL_ID=$(curl -X POST http://localhost:8080/api/deals \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "buyerId": "00000000-0000-0000-0000-000000000001",
    "sellerId": "00000000-0000-0000-0000-000000000002",
    "itemRef": "DEMO-RE-DOC-001",
    "category": "REAL_ESTATE_SALE",
    "totalAmount": 500000.00,
    "currency": "USD"
  }' | jq -r '.data.id')

# Fund
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/fund \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001"

# Deliver
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/deliver \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000002"

# Raise issue
curl -X POST http://localhost:8080/api/deals/$DEAL_ID/issue \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "reasonCode": "DOCUMENT_MISMATCH",
    "freeText": "Contract shows different property address than agreed",
    "evidenceIds": ["<evidence-id-from-upload>"]
  }'
```

---

## Expected Deal IDs

After seeding, you should see deals with these item references:
- `DEMO-UC-HAPPY-001` - Used Car Happy Path (INSPECTION)
- `DEMO-UC-ISSUE-001` - Used Car Issue (ISSUE)
- `DEMO-RE-DOC-001` - Real Estate Doc Mismatch (ISSUE)

**Note**: Actual UUIDs will vary. Use itemRef to find deals in UI.

---

## Viewing Seeded Deals

### Frontend
- Navigate to deal list or search by itemRef
- Direct URL: `http://localhost:3000/deals/{deal-id}`

### API
```bash
# List all deals
curl http://localhost:8080/api/deals

# Get specific deal by itemRef (if search endpoint exists)
# Or use deal ID from creation response
```

---

## Verification Checklist

After seeding, verify:

- [ ] Used Car Happy Path Deal:
  - [ ] State: `INSPECTION`
  - [ ] AUTO_APPROVE timer visible
  - [ ] Evidence metadata present (photos)
  - [ ] Money Summary shows 85% immediate, 15% holdback

- [ ] Used Car Issue Deal:
  - [ ] State: `ISSUE`
  - [ ] DISPUTE_TTL timer visible
  - [ ] Evidence metadata present
  - [ ] Reason code: `DAMAGE_MINOR`

- [ ] Real Estate Doc Mismatch Deal:
  - [ ] State: `ISSUE`
  - [ ] Category: `REAL_ESTATE_SALE`
  - [ ] Reason code: `DOCUMENT_MISMATCH`
  - [ ] Evidence metadata present (contract PDF)

---

## Troubleshooting

### Templates Not Found
If you see "No template found for category":
1. Ensure `CategoryTemplateInitializationService` ran on startup
2. Or manually create templates via API/admin

### Evidence Upload Fails
- Evidence metadata is typically created during `deliver` step
- If separate upload endpoint exists, use it before raising issue

### Deals Not Appearing
- Check backend logs for errors
- Verify database connection
- Check user IDs match demo user IDs

---

## Cleanup

To reset demo data:

```bash
# Option 1: Delete via API (if delete endpoint exists)
curl -X DELETE http://localhost:8080/api/deals/{deal-id}

# Option 2: Database cleanup (if needed)
# Connect to database and delete deals with itemRef starting with "DEMO-"
```

---

## Next Steps

After seeding:
1. Run demo script: See `/docs/DEMO_SCRIPT.md`
2. Test smoke tests: See smoke test page at `/smoke-test`
3. Verify timers: Check that all timers are visible
