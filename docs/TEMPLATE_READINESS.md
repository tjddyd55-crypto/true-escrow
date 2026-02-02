# Template Readiness Checklist

**Purpose**: Ensure every new scope has production-grade templates before launch  
**Phase 7**: Template validation for expansion scopes

---

## Objective

Validate that templates for new (country × category) combinations are:
- Production-ready
- Parameter-complete
- Tested and verified

---

## Required Templates

### File Naming Convention

`{COUNTRY}_{CATEGORY}_v1.json`

**Examples**:
- `MN_USED_CAR_DEALER_v1.json`
- `MN_REAL_ESTATE_SALE_v1.json`
- `KR_USED_CAR_PRIVATE_v1.json`

### Location

`/templates/country/{COUNTRY}_{CATEGORY}_v1.json`

---

## Parameter Validation

### Required Parameters

Each template must include:

1. **inspectionTtlDays** (integer)
   - Used Car: Typically 3 days
   - Real Estate: Typically 7 days
   - Must be > 0

2. **disputeTtlHours** (integer)
   - Typically 48-72 hours
   - Must be > 0

3. **holdbackRatio** (decimal, 0.0 - 1.0)
   - Used Car: Typically 0.10 - 0.15
   - Real Estate: Typically 0.20 - 0.30
   - Must be > 0 and < 1.0

4. **immediateRatio** (decimal, 0.0 - 1.0)
   - Must satisfy: `holdbackRatio + immediateRatio = 1.0`
   - Must be > 0 and < 1.0

5. **evidenceRequired** (boolean)
   - Default: `true`
   - Rarely set to `false`

6. **offsetCapsByReasonCode** (object)
   - Optional but recommended
   - Format: `{ "REASON_CODE": decimal }`
   - Example: `{ "DAMAGE_MINOR": 0.1, "MISSING_PARTS": 0.1 }`

### Validation Rules

**Rule 1**: `holdbackRatio + immediateRatio = 1.0`
- ✅ Valid: `holdbackRatio: 0.15, immediateRatio: 0.85` (sum = 1.0)
- ❌ Invalid: `holdbackRatio: 0.15, immediateRatio: 0.80` (sum = 0.95)

**Rule 2**: All numeric values must be positive
- ✅ Valid: `inspectionTtlDays: 3`
- ❌ Invalid: `inspectionTtlDays: -1`

**Rule 3**: Reason codes must be valid enum values
- ✅ Valid: `"DAMAGE_MINOR"`
- ❌ Invalid: `"INVALID_CODE"`

---

## Template Structure Example

```json
{
  "country": "MN",
  "category": "USED_CAR_DEALER",
  "version": "v1",
  "params": {
    "inspectionTtlDays": 3,
    "disputeTtlHours": 48,
    "autoApproveEnabled": true,
    "holdbackRatio": 0.15,
    "immediateRatio": 0.85,
    "evidenceRequired": true,
    "offsetCapsByReasonCode": {
      "DAMAGE_MINOR": 0.1,
      "MISSING_PARTS": 0.1
    }
  }
}
```

---

## Validation Checklist

### Pre-Launch Validation

- [ ] **Template file exists**
  - File path: `/templates/country/{COUNTRY}_{CATEGORY}_v1.json`
  - File is valid JSON
  - File is readable

- [ ] **All required parameters present**
  - [ ] `inspectionTtlDays`
  - [ ] `disputeTtlHours`
  - [ ] `holdbackRatio`
  - [ ] `immediateRatio`
  - [ ] `evidenceRequired`
  - [ ] `offsetCapsByReasonCode` (optional but recommended)

- [ ] **Parameter values validated**
  - [ ] `holdbackRatio + immediateRatio = 1.0`
  - [ ] All numeric values > 0
  - [ ] Reason codes are valid enum values
  - [ ] TTL values are reasonable (inspection: 2-7 days, dispute: 24-96 hours)

- [ ] **Template loads correctly**
  - Template can be loaded by `CategoryTemplateService`
  - Template can be parsed by `TemplateParserService`
  - No parsing errors

---

## Dry-Run Validation

### Deal Creation Test

- [ ] **Create test deal**
  - Use demo profile
  - Create deal with new (country × category)
  - Verify deal created successfully
  - Verify template applied correctly

- [ ] **Verify timers visible**
  - Deal enters INSPECTION state
  - AUTO_APPROVE timer visible
  - Timer duration matches template (`inspectionTtlDays`)
  - Timer countdown works correctly

- [ ] **Verify money summary correct**
  - Total amount displayed correctly
  - Immediate amount = `totalAmount × immediateRatio`
  - Holdback amount = `totalAmount × holdbackRatio`
  - Sum = total amount

- [ ] **Verify evidence upload works**
  - Evidence upload functional
  - Evidence types accepted (if category-specific)
  - Evidence metadata stored correctly

- [ ] **Verify full lifecycle**
  - CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
  - All state transitions work
  - Timers fire correctly
  - Ledger entries created correctly

---

## Category-Specific Validation

### USED_CAR_DEALER

**Expected Parameters**:
- `inspectionTtlDays`: 3
- `disputeTtlHours`: 48
- `holdbackRatio`: 0.10 - 0.15
- `immediateRatio`: 0.85 - 0.90

**Evidence Types**:
- Photos (exterior, interior, odometer)
- Inspection report (optional, dealer may provide)
- Registration document (optional)

**Validation**:
- [ ] Parameters match expected ranges
- [ ] Evidence types appropriate for dealer sales

---

### REAL_ESTATE_SALE

**Expected Parameters**:
- `inspectionTtlDays`: 7
- `disputeTtlHours`: 72
- `holdbackRatio`: 0.20 - 0.30
- `immediateRatio`: 0.70 - 0.80

**Evidence Types**:
- Contract document (PDF, required)
- Property photos (required)
- Inspection report (optional)

**Validation**:
- [ ] Parameters match expected ranges
- [ ] Evidence types appropriate for real estate
- [ ] Longer inspection period (7 days vs 3 days)

---

### KR × USED_CAR_PRIVATE

**Expected Parameters**:
- `inspectionTtlDays`: 3
- `disputeTtlHours`: 48
- `holdbackRatio`: 0.15
- `immediateRatio`: 0.85

**Additional Validation**:
- [ ] Korean language (ko) fully reviewed
- [ ] Currency formatting: KRW
- [ ] Evidence types validated (photos sufficient)
- [ ] Dispute TTL reviewed for Korean user expectations

**Validation**:
- [ ] Parameters match expected values
- [ ] i18n labels correct
- [ ] Currency formatting works

---

## Forbidden Actions

### ❌ Do NOT Edit Existing Template Versions

**Rule**: Templates are immutable once published

**Example**:
- ❌ Editing `MN_USED_CAR_PRIVATE_v1.json` after deals created
- ✅ Creating `MN_USED_CAR_PRIVATE_v2.json` for changes

---

### ❌ Do NOT Hot-Fix Via Code

**Rule**: All changes must be via template parameters

**Example**:
- ❌ Adding code branch: `if (category == USED_CAR_DEALER) { ... }`
- ✅ Updating template: `"inspectionTtlDays": 4`

---

## Template Readiness Sign-Off

### Before Launch

- [ ] Template file exists and validated
- [ ] All parameters present and correct
- [ ] Dry-run deal creation successful
- [ ] Timers visible and correct
- [ ] Money summary correct
- [ ] Evidence upload works
- [ ] Full lifecycle tested

**Sign-Off**:
- [ ] Engineer: _________________ Date: _______
- [ ] Operator: _________________ Date: _______
- [ ] Pilot Coordinator: _________________ Date: _______

---

## Next Steps

1. **Expansion Plan**: See `/docs/EXPANSION_PLAN.md`
2. **Go-Live Runbook**: See `/docs/GO_LIVE_RUNBOOK.md`
3. **Template Tuning**: See `/docs/TEMPLATE_TUNING_FRAMEWORK.md`
