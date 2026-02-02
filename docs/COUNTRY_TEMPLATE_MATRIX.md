# Country Template Matrix

**Purpose**: Summary of country-specific template parameters  
**Last Updated**: 2026-02-01  
**Note**: These are starting parameters. Adjust after pilot feedback.

---

## Parameter Definitions

- **inspectionTtlDays**: Auto-approve timer duration (days)
- **disputeTtlHours**: Dispute resolution TTL (hours)
- **holdbackRatio**: Percentage of total amount held back (0.0 - 1.0)
- **immediateRatio**: Percentage of total amount released immediately (0.0 - 1.0)
- **evidenceRequired**: Whether evidence is mandatory for issue creation (default: true)
- **offsetCapsByReasonCode**: Maximum offset percentage by reason code (0.0 - 1.0)

**Constraint**: `immediateRatio + holdbackRatio = 1.0`

---

## REAL_ESTATE_SALE

| Country | Inspection TTL | Dispute TTL | Holdback | Immediate |
|---------|----------------|-------------|----------|-----------|
| KR      | 7 days         | 72 hours    | 25%      | 75%       |
| MN      | 7 days         | 72 hours    | 25%      | 75%       |
| JP      | 7 days         | 72 hours    | 20%      | 80%       |
| IN      | 7 days         | 96 hours    | 30%      | 70%       |
| PH      | 7 days         | 72 hours    | 25%      | 75%       |
| KH      | 7 days         | 72 hours    | 25%      | 75%       |
| TW      | 7 days         | 72 hours    | 20%      | 80%       |

**Notes**:
- India (IN) has longer dispute TTL (96h) and higher holdback (30%)
- Japan (JP) and Taiwan (TW) have lower holdback (20%)

---

## REAL_ESTATE_RENTAL

| Country | Inspection TTL | Dispute TTL | Holdback | Immediate |
|---------|----------------|-------------|----------|-----------|
| KR      | 7 days         | 72 hours    | 25%      | 75%       |
| MN      | 7 days         | 72 hours    | 25%      | 75%       |
| JP      | 7 days         | 72 hours    | 20%      | 80%       |
| IN      | 7 days         | 96 hours    | 30%      | 70%       |
| PH      | 7 days         | 72 hours    | 25%      | 75%       |
| KH      | 7 days         | 72 hours    | 25%      | 75%       |
| TW      | 7 days         | 72 hours    | 20%      | 80%       |

**Notes**: Same as REAL_ESTATE_SALE (rental typically uses same parameters)

---

## USED_CAR_PRIVATE

| Country | Inspection TTL | Dispute TTL | Holdback | Immediate |
|---------|----------------|-------------|----------|-----------|
| KR      | 3 days         | 48 hours    | 15%      | 85%       |
| MN      | 3 days         | 48 hours    | 15%      | 85%       |
| JP      | 3 days         | 48 hours    | 10%      | 90%       |
| IN      | 3 days         | 72 hours    | 15%      | 85%       |
| PH      | 3 days         | 48 hours    | 15%      | 85%       |
| KH      | 3 days         | 48 hours    | 15%      | 85%       |
| TW      | 3 days         | 48 hours    | 10%      | 90%       |

**Notes**:
- Used car has shorter inspection TTL (3 days vs 7 days)
- India (IN) has longer dispute TTL (72h vs 48h)
- Japan (JP) and Taiwan (TW) have lower holdback (10%)

---

## USED_CAR_DEALER

| Country | Inspection TTL | Dispute TTL | Holdback | Immediate |
|---------|----------------|-------------|----------|-----------|
| KR      | 3 days         | 48 hours    | 15%      | 85%       |
| MN      | 3 days         | 48 hours    | 15%      | 85%       |
| JP      | 3 days         | 48 hours    | 10%      | 90%       |
| IN      | 3 days         | 72 hours    | 15%      | 85%       |
| PH      | 3 days         | 48 hours    | 15%      | 85%       |
| KH      | 3 days         | 48 hours    | 15%      | 85%       |
| TW      | 3 days         | 48 hours    | 10%      | 90%       |

**Notes**: Same as USED_CAR_PRIVATE (dealer typically uses same parameters)

---

## Offset Caps by Reason Code

### Default (Most Countries)

- **DAMAGE_MINOR**: 10% of holdback
- **MISSING_PARTS**: 10% of holdback

### India (IN) - Higher Caps

- **DAMAGE_MINOR**: 15% of holdback
- **MISSING_PARTS**: 15% of holdback

### Japan (JP) / Taiwan (TW) - Lower Caps

- **DAMAGE_MINOR**: 5% of holdback (used car)
- **MISSING_PARTS**: 5% of holdback (used car)

---

## Template Loading

Templates are stored in `/templates/country/` directory.

**File Naming**: `{COUNTRY}_{CATEGORY}_v{version}.json`

**Example**: `KR_USED_CAR_PRIVATE_v1.json`

**Loading Strategy**:
1. New deals use latest template version for (country x category)
2. Existing deals stay pinned to template version at creation
3. Templates are immutable (versioned)

---

## Template Structure

```json
{
  "country": "KR",
  "category": "USED_CAR_PRIVATE",
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

## Pilot Feedback Integration

After pilot runs, update templates based on:
- Time-to-settle metrics
- Dispute rate
- Admin intervention rate
- User confusion points

**Process**:
1. Collect feedback via `/docs/PILOT_FEEDBACK_FORM.md`
2. Analyze metrics
3. Adjust template parameters (no core code changes)
4. Create new template version (v2, v3, etc.)
5. New deals use new version; existing deals stay pinned

---

## Next Steps

1. **Pilot Runbook**: See `/docs/PILOT_RUNBOOK.md`
2. **Pilot Feedback Form**: See `/docs/PILOT_FEEDBACK_FORM.md`
3. **Template Loading**: Implement template loader service (if not already done)
