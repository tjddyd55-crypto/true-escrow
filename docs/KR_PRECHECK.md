# KR Pre-check — USED_CAR_PRIVATE

**Purpose**: Prepare Korea-specific rollout safely  
**Phase 7**: Operational readiness for KR × USED_CAR_PRIVATE expansion

---

## Objective

Validate Korea (KR) readiness for USED_CAR_PRIVATE category before go-live.

**Important Note**: This is **NOT legal approval**. This is operational readiness only.

For actual legal compliance, consult local legal experts in Korea.

---

## Checklist

### 1. Language: Korean (ko) Fully Reviewed

#### UI Labels

- [ ] **Deal States**: All 7 states translated
  - CREATED → "생성됨"
  - FUNDED → "자금 입금됨"
  - DELIVERED → "배송 완료"
  - INSPECTION → "검수 중"
  - APPROVED → "승인됨"
  - ISSUE → "문제 제기됨"
  - SETTLED → "정산 완료"

- [ ] **Timers**: Timer labels translated
  - AUTO_APPROVE → "자동 승인"
  - DISPUTE_TTL → "분쟁 해결 기한"
  - HOLDBACK_RELEASE → "보류금 해제"

- [ ] **Reason Codes**: All reason codes translated
  - NOT_DELIVERED → "배송되지 않음"
  - DAMAGE_MAJOR → "심각한 손상"
  - DAMAGE_MINOR → "경미한 손상"
  - MISSING_PARTS → "누락된 부품"
  - QUALITY_NOT_MATCHING → "품질 불일치"
  - DOCUMENT_MISMATCH → "문서 불일치"
  - OTHER → "기타"

- [ ] **Actions**: Action buttons translated
  - Fund Deal → "거래 자금 입금"
  - Mark Delivered → "배송 완료 표시"
  - Approve → "승인"
  - Raise Issue → "문제 제기"
  - Upload Evidence → "증빙 업로드"

- [ ] **Money Terms**: Money-related terms translated
  - Total Amount → "총 금액"
  - Immediate Amount → "즉시 지급 금액"
  - Holdback Amount → "보류 금액"
  - Released → "지급됨"
  - Held → "보류 중"

#### Legal/UX Copy

- [ ] **Terms & Conditions**: Korean version reviewed
  - User agreement translated
  - Terms of service translated
  - Privacy policy translated

- [ ] **Disclaimers**: Korean version reviewed
  - "This is a platform process; not legal advice" → "이것은 플랫폼 프로세스입니다; 법적 조언이 아닙니다"
  - "Settlement outcomes are rule-based" → "정산 결과는 규칙 기반입니다"

- [ ] **Error Messages**: Korean error messages reviewed
  - Validation errors translated
  - System errors translated
  - User-friendly error messages

**Validation**:
- [ ] Native Korean speaker reviewed all translations
- [ ] No machine translation artifacts
- [ ] Cultural appropriateness verified
- [ ] Legal terminology accurate (if applicable)

---

### 2. Currency Formatting: KRW

#### Currency Display

- [ ] **Currency Code**: KRW displayed correctly
  - Format: `₩10,000` or `10,000 KRW`
  - Consistent across all money displays

- [ ] **Number Formatting**: Korean number format
  - Thousands separator: comma (`,`)
  - Decimal places: 0 (KRW has no decimals)
  - Example: `₩1,000,000` (not `₩1000000`)

- [ ] **Money Summary**: All amounts in KRW
  - Total amount: KRW
  - Immediate amount: KRW
  - Holdback amount: KRW
  - Ledger entries: KRW

**Validation**:
- [ ] Currency formatting tested with various amounts
- [ ] Large amounts formatted correctly (millions, billions)
- [ ] Currency symbol displays correctly
- [ ] No currency conversion errors

---

### 3. Evidence Types Validated

#### Photos Sufficient

- [ ] **Evidence Types**: Photos are sufficient for used car
  - Exterior photos: Required
  - Interior photos: Required
  - Odometer photo: Required
  - Inspection report: Optional
  - Registration document: Optional

- [ ] **Photo Requirements**: Clear requirements
  - Minimum photo count: 3 (exterior, interior, odometer)
  - Photo quality: Clear, not blurry
  - Photo format: JPG, PNG accepted

- [ ] **Upload Process**: User-friendly
  - Multiple photos can be uploaded
  - Photo preview available
  - Upload progress indicator

**Validation**:
- [ ] Test evidence upload with Korean users
- [ ] Verify photos display correctly
- [ ] Check photo metadata storage

---

### 4. Dispute TTL Reviewed for User Expectation

#### TTL Duration

- [ ] **Current TTL**: 48 hours (from template)
  - Template: `KR_USED_CAR_PRIVATE_v1.json`
  - Parameter: `disputeTtlHours: 48`

- [ ] **User Expectation**: 48 hours appropriate?
  - Korean users expect: [Research needed]
  - Typical dispute resolution time in Korea: [Research needed]
  - Adjust if needed: [Yes/No]

- [ ] **TTL Communication**: Clear to users
  - TTL countdown visible
  - TTL explanation in Korean
  - What happens when TTL expires: Explained

**Validation**:
- [ ] TTL duration tested with Korean users
- [ ] TTL explanation clear
- [ ] User feedback on TTL duration collected

---

## Additional Considerations

### Cultural Considerations

- [ ] **Communication Style**: Korean communication preferences
  - Formal vs informal language
  - Politeness levels
  - Business communication norms

- [ ] **User Expectations**: Korean user expectations
  - Response time expectations
  - Dispute resolution expectations
  - Customer service expectations

**Note**: These are operational considerations, not legal requirements.

---

### Technical Considerations

- [ ] **Timezone**: Korea Standard Time (KST, UTC+9)
  - Timestamps display in KST
  - TTL calculations use KST
  - Business hours defined in KST

- [ ] **Payment Methods**: Korean payment preferences
  - Bank transfer (common in Korea)
  - Mobile payment (if applicable)
  - Credit card (if applicable)

**Note**: Payment integration is separate from escrow core.

---

## Pre-Launch Validation

### Dry-Run Test

- [ ] **Create Test Deal**: KR × USED_CAR_PRIVATE
  - Use demo profile
  - Create deal with KR country
  - Verify template applied: `KR_USED_CAR_PRIVATE_v1.json`

- [ ] **Verify Korean Display**:
  - All labels in Korean
  - Currency in KRW
  - Timers visible
  - Money summary correct

- [ ] **Verify Full Lifecycle**:
  - CREATED → FUNDED → DELIVERED → INSPECTION → APPROVED → SETTLED
  - All state labels in Korean
  - All actions in Korean
  - All error messages in Korean

- [ ] **Verify Evidence Upload**:
  - Photos upload works
  - Photo preview displays
  - Evidence metadata stored

---

## Sign-Off

### Before Go-Live

- [ ] Language (ko) fully reviewed
- [ ] Currency formatting (KRW) tested
- [ ] Evidence types validated
- [ ] Dispute TTL reviewed
- [ ] Dry-run test successful

**Sign-Off**:
- [ ] Korean Language Reviewer: _________________ Date: _______
- [ ] Engineer: _________________ Date: _______
- [ ] Operator: _________________ Date: _______
- [ ] Pilot Coordinator: _________________ Date: _______

---

## Legal Disclaimer

**Important**: This pre-check is for **operational readiness only**. It does not constitute legal approval.

**For Legal Compliance**:
- Consult local legal experts in Korea
- Review Korean regulations for:
  - Escrow services
  - Payment processing
  - Consumer protection
  - Data protection

**This Checklist Helps With**:
- Operational readiness
- User experience
- Technical validation
- Cultural considerations

---

## Next Steps

1. **Expansion Plan**: See `/docs/EXPANSION_PLAN.md`
2. **Go-Live Runbook**: See `/docs/GO_LIVE_RUNBOOK.md`
3. **Template Readiness**: See `/docs/TEMPLATE_READINESS.md`
