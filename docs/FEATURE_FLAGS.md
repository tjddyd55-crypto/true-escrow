# Feature Flags & Environments

**Purpose**: Enable/disable pilot instantly without code changes or DB edits  
**Phase 6**: Safe toggles for MN × USED_CAR_PRIVATE pilot

---

## Required Flags

### 1. PILOT_ENABLED (boolean)

**Purpose**: Master flag to enable/disable pilot deal creation

**Behavior**:
- `false`: Disallow creating new pilot-category deals (MN used car)
- `true`: Allow creating new pilot-category deals
- Existing deals continue normally regardless of flag state

**Configuration**:
```yaml
pilot:
  enabled: false  # Default: disabled
```

**Enforcement**: Backend validates at deal creation entry point

---

### 2. PILOT_COUNTRY_ALLOWLIST (list)

**Purpose**: Restrict pilot to specific countries

**Example**:
```yaml
pilot:
  country-allowlist:
    - MN
```

**Behavior**:
- Only deals in allowlisted countries can be created when pilot is enabled
- Empty list = no countries allowed (effectively disables pilot)

---

### 3. PILOT_CATEGORY_ALLOWLIST (list)

**Purpose**: Restrict pilot to specific categories

**Example**:
```yaml
pilot:
  category-allowlist:
    - USED_CAR_PRIVATE
```

**Behavior**:
- Only deals in allowlisted categories can be created when pilot is enabled
- Empty list = no categories allowed (effectively disables pilot)

---

### 4. PILOT_TEMPLATE_VERSION (string)

**Purpose**: Specify template version for new pilot deals

**Example**:
```yaml
pilot:
  template-version: v1  # or v2, v3, etc.
```

**Behavior**:
- New deals pick this version
- Existing deals keep pinned version (immutable)
- Allows template tuning without affecting existing deals

---

## Configuration Files

### Default Configuration (`application.yml`)

```yaml
pilot:
  enabled: false
  country-allowlist: []
  category-allowlist: []
  template-version: v1
```

**Usage**: Default profile (pilot disabled)

---

### Pilot Configuration (`application-pilot.yml`)

```yaml
pilot:
  enabled: true
  country-allowlist:
    - MN
  category-allowlist:
    - USED_CAR_PRIVATE
  template-version: v1
```

**Usage**: Enable with `--spring.profiles.active=pilot`

---

## Enforcement Rules

### Backend Enforcement (Source of Truth)

**Location**: `DealApplicationService.createDeal()`

**Validation**:
1. Check `PILOT_ENABLED` flag
2. Check country in `PILOT_COUNTRY_ALLOWLIST`
3. Check category in `PILOT_CATEGORY_ALLOWLIST`
4. Throw `IllegalArgumentException` if validation fails

**Error Messages**:
- Pilot disabled: "Pilot is currently disabled. New pilot deals cannot be created. Existing deals will continue normally."
- Country not allowed: "Country 'XX' is not in pilot allowlist. Allowed countries: [MN]"
- Category not allowed: "Category 'XX' is not in pilot allowlist. Allowed categories: [USED_CAR_PRIVATE]"

---

### UI Enforcement (UX Optimization)

**Purpose**: Hide creation paths in UI (UX optimization only)

**Note**: UI can hide paths, but backend is source of truth. Backend will reject even if UI allows.

**Implementation** (Frontend):
```typescript
// Check feature flag before showing create deal button
if (featureFlags.pilotEnabled && 
    featureFlags.pilotCountryAllowlist.includes(country) &&
    featureFlags.pilotCategoryAllowlist.includes(category)) {
  // Show create deal button
}
```

---

## Validation Checklist

### Toggle OFF (Pilot Disabled)

- [ ] Cannot create new MN used car deals
- [ ] Error message: "Pilot is currently disabled..."
- [ ] Existing deals continue normally
- [ ] Other countries/categories unaffected

**Test**:
```bash
# Set pilot.enabled=false
curl -X POST http://localhost:8080/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "...",
    "sellerId": "...",
    "itemRef": "TEST-001",
    "category": "USED_CAR_PRIVATE",
    "totalAmount": 10000.00,
    "currency": "USD"
  }'
# Expected: 400 Bad Request with pilot disabled message
```

---

### Toggle ON (Pilot Enabled)

- [ ] Can create new MN used car deals
- [ ] Other countries/categories unchanged (if not in allowlist)
- [ ] Template version applied correctly

**Test**:
```bash
# Set pilot.enabled=true, country-allowlist=[MN], category-allowlist=[USED_CAR_PRIVATE]
curl -X POST http://localhost:8080/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "...",
    "sellerId": "...",
    "itemRef": "TEST-001",
    "category": "USED_CAR_PRIVATE",
    "totalAmount": 10000.00,
    "currency": "USD"
  }'
# Expected: 200 OK with deal created
```

---

### Version Flip (v1 → v2)

- [ ] New deals use v2 template
- [ ] Old deals remain on v1 (pinned)
- [ ] Template parameters differ between v1 and v2

**Test**:
1. Create deal with `template-version: v1`
2. Change to `template-version: v2`
3. Create new deal
4. Verify new deal uses v2, old deal still uses v1

---

## Rollback Plan

### Instant Rollback (No Code Changes)

**Step 1**: Set feature flag to disabled
```yaml
pilot:
  enabled: false
```

**Step 2**: Restart application (or use dynamic config if available)

**Result**:
- New pilot deals cannot be created
- Existing deals continue normally
- No data loss
- No code changes required

---

### Template Rollback

**If v2 template has issues**:

**Step 1**: Revert template version
```yaml
pilot:
  template-version: v1
```

**Step 2**: New deals use v1 again

**Note**: Do NOT delete v2 template; keep for audit and future reuse

---

## Environment-Specific Configuration

### Development
```yaml
pilot:
  enabled: true  # For testing
  country-allowlist: [MN]
  category-allowlist: [USED_CAR_PRIVATE]
  template-version: v1
```

### Staging
```yaml
pilot:
  enabled: true  # For rehearsal
  country-allowlist: [MN]
  category-allowlist: [USED_CAR_PRIVATE]
  template-version: v1
```

### Production
```yaml
pilot:
  enabled: true  # For actual pilot
  country-allowlist: [MN]
  category-allowlist: [USED_CAR_PRIVATE]
  template-version: v1
```

---

## Dynamic Configuration (Future)

**Current**: Configuration via YAML files (requires restart)

**Future Enhancement**: Dynamic configuration service
- Update flags via API
- No restart required
- Audit log of flag changes

---

## Monitoring

### Flag State Monitoring

**Metrics to Track**:
- `pilot.enabled` state (boolean)
- `pilot.deal.creation.attempted` (counter)
- `pilot.deal.creation.rejected` (counter)
- `pilot.deal.creation.rejected.reason` (histogram by reason)

**Alerts**:
- Alert if pilot disabled but deals still being created (should not happen)
- Alert if rejection rate > 10% (may indicate configuration issue)

---

## Next Steps

1. **Pilot Launch Plan**: See `/docs/PILOT_LAUNCH_PLAN.md`
2. **Ops Dashboard**: See `/docs/OPS_DASHBOARD_SPEC.md`
3. **Incident Runbook**: See `/docs/INCIDENT_RUNBOOK.md`
