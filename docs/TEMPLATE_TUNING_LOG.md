# Template Tuning Log

**Purpose**: Append-only log of all template parameter changes  
**Format**: One entry per tuning change with reason, metrics, changes, and impact

---

## 2026-02-01 — Initial Template (v1)

**Template**: `MN_USED_CAR_PRIVATE_v1.json`

**Parameters**:
- `inspectionTtlDays`: 3
- `disputeTtlHours`: 48
- `holdbackRatio`: 0.15
- `immediateRatio`: 0.85
- `evidenceRequired`: true
- `offsetCapsByReasonCode`: 
  - `DAMAGE_MINOR`: 0.1
  - `MISSING_PARTS`: 0.1

**Reason**: Initial template for pilot launch

**Expected Effect**: Baseline for pilot metrics

**Actual Impact**: TBD (after pilot completion)

---

## Template Tuning Entries

*(Entries will be added here as templates are tuned)*

---

## Format for New Entries

```markdown
## YYYY-MM-DD — vX → vY

**Reason**: [Why this change was made - metric or feedback]

**Metrics**:
- [Metric name]: [Value]
- [Another metric]: [Value]

**Changes**:
- `parameterName`: [old value] → [new value]
- `anotherParameter`: [old value] → [new value]

**Expected Effect**: 
- [What we expect to happen]

**Actual Impact** (updated after deployment):
- [What actually happened]
- [Metrics comparison: vX vs vY]
```

---

## Notes

- This log is append-only (never delete entries)
- Each entry should be dated and include reason
- Actual impact should be updated after sufficient data collection
- Keep entries concise but complete
